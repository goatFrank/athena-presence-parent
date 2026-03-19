package com.athena.attendance.service.impl;

import com.athena.attendance.entity.*;
import com.athena.attendance.repository.*;
import com.athena.attendance.service.ProfileService;
import com.athena.common.dto.ProfileDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final ProfileRepository profileRepository;
    private final TenantRepository tenantRepository;
    private final DepartmentRepository departmentRepository;
    private final LocationRepository locationRepository;
    private final com.athena.attendance.repository.RoleRepository roleRepository;
    private final com.athena.attendance.service.InviteLinkService inviteLinkService;

    @Override
    public ProfileDTO getProfile(UUID userId) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Profile not found for user: " + userId));

        return mapToDTO(profile);
    }

    @Override
    public java.util.List<ProfileDTO> getProfilesByTenant(Long tenantId, UUID adminUserId) {
        Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Admin profile not found"));

        if (adminProfile.getRole() == null
                || (!adminProfile.getRole().getId().equals(3L) && !adminProfile.getRole().getId().equals(1L))) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Solo gli amministratori possono vedere i profili del tenant");
        }

        if (!adminProfile.getRole().getId().equals(1L) && !adminProfile.getTenantId().equals(tenantId)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Non puoi vedere i profili di un altro tenant");
        }

        return profileRepository.findByTenantId(tenantId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public java.util.List<ProfileDTO> getAllProfiles(java.util.UUID adminUserId) {
        Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Admin profile not found"));

        if (adminProfile.getRole() == null || !adminProfile.getRole().getId().equals(1L)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Solo i superadmin possono vedere tutti i profili");
        }

        return profileRepository.findAll().stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deleteProfile(java.util.UUID profileId, java.util.UUID adminUserId) {
        Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Admin profile not found"));

        if (adminProfile.getRole() == null
                || (!adminProfile.getRole().getId().equals(3L) && !adminProfile.getRole().getId().equals(1L))) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Solo gli amministratori possono eliminare dipendenti");
        }

        Profile targetProfile = profileRepository.findById(profileId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Profilo non trovato"));

        // Tenant admin can only delete profiles in own tenant; superadmin can delete
        // any
        if (!adminProfile.getRole().getId().equals(1L)
                && !adminProfile.getTenantId().equals(targetProfile.getTenantId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Non puoi eliminare un dipendente di un altro tenant");
        }

        // Prevent self-deletion
        if (adminUserId.equals(profileId)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Non puoi eliminare il tuo stesso profilo");
        }

        profileRepository.delete(targetProfile);
    }

    private ProfileDTO mapToDTO(Profile profile) {
        String tenantName = "Unknown Tenant";
        String tenantStatus = null;
        if (profile.getTenantId() != null) {
            Tenant tenant = tenantRepository.findById(profile.getTenantId()).orElse(null);
            if (tenant != null) {
                tenantName = tenant.getName();
                tenantStatus = tenant.getStatus() != null ? tenant.getStatus().name() : null;
            }
        }

        String departmentName = "Unknown Department";
        if (profile.getDepartmentId() != null) {
            departmentName = departmentRepository.findById(profile.getDepartmentId())
                    .map(Department::getName)
                    .orElse("Unknown Department");
        }

        String locationName = "Unknown Location";
        if (profile.getLocationId() != null) {
            locationName = locationRepository.findById(profile.getLocationId())
                    .map(com.athena.attendance.entity.Location::getName)
                    .orElse("Unknown Location");
        }

        return ProfileDTO.builder()
                .id(profile.getId())
                .fullName(profile.getFullName())
                .role(profile.getRole() != null ? profile.getRole().getName() : null)
                .roleId(profile.getRole() != null ? profile.getRole().getId() : null)
                .tenantId(profile.getTenantId())
                .departmentId(profile.getDepartmentId())
                .tenantName(tenantName)
                .departmentName(departmentName)
                .locationId(profile.getLocationId())
                .locationName(locationName)
                .profileCellphone(profile.getProfileCellphone())
                .tenantStatus(tenantStatus)
                .managerId(profile.getManagerId())
                .build();
    }

    @Override
    public String updateAvatar(UUID userId, String avatarUrl) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Profile not found for user: " + userId));

        if (avatarUrl == null || avatarUrl.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Avatar URL is empty");
        }

        profile.setAvatarUrl(avatarUrl);
        profileRepository.save(profile);

        return avatarUrl;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void createProfile(UUID userId, com.athena.common.dto.SignupRequest request) {
        Profile profile = new Profile();
        profile.setId(userId);
        profile.setFullName(request.getFullName());

        if (request.getInviteToken() != null && !request.getInviteToken().isBlank()) {
            // Registration via Invite Link
            com.athena.common.dto.InviteLinkDTO invite = inviteLinkService.validateToken(request.getInviteToken());

            profile.setTenantId(invite.getTenantId());
            profile.setManagerId(invite.getManagerId());
            profile.setDepartmentId(invite.getDepartmentId());

            // Assign EMPLOYEE role (ID 4)
            Role employeeRole = roleRepository.findById(4L)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Role EMPLOYEE not found"));
            profile.setRole(employeeRole);

            // Increment used count
            inviteLinkService.useToken(request.getInviteToken());
        } else {
            // Standard registration - Create new Tenant
            if (tenantRepository.findByName(request.getCompanyName()).isPresent()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "A company with this name is already registered");
            }

            Tenant tenant = new Tenant();
            tenant.setName(request.getCompanyName());
            tenant.setStatus(TenantStatus.PENDING);
            tenant = tenantRepository.save(tenant);

            profile.setTenantId(tenant.getId());

            // Assign ADMIN_TENANT role (ID 2)
            Role adminRole = roleRepository.findById(2L)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Role AMMINISTRATORE_TENANT not found"));
            profile.setRole(adminRole);
        }

        profileRepository.save(profile);
    }
}
