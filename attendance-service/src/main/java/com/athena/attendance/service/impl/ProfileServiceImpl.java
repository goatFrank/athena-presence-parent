package com.athena.attendance.service.impl;

import com.athena.attendance.entity.*;
import com.athena.attendance.repository.*;
import com.athena.attendance.service.ProfileService;
import com.athena.common.dto.ProfileDTO;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.athena.common.constants.RoleConstants;

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
    private final AttendanceRepository attendanceRepository;
    private final InviteLinkRepository inviteLinkRepository;

    private static final String ERR_PROFILE_NOT_FOUND = "Profile not found for user: ";
    private static final String ERR_ADMIN_PROFILE_NOT_FOUND = "Admin profile not found";

    @org.springframework.beans.factory.annotation.Value("${supabase.url}")
    private String supabaseUrl;

    @Override
    public ProfileDTO getProfile(UUID userId) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, ERR_PROFILE_NOT_FOUND + userId));

        return mapToDTO(profile);
    }

    @Override
    public Page<ProfileDTO> getProfilesByTenant(Long tenantId, UUID adminUserId, Pageable pageable) {
        Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, ERR_ADMIN_PROFILE_NOT_FOUND));

        if (adminProfile.getRole() == null
                || (!adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN)
                        && !adminProfile.getRole().getId().equals(RoleConstants.ADMIN_TENANT)
                        && !adminProfile.getRole().getId().equals(RoleConstants.MANAGER)
                        && !adminProfile.getRole().getId().equals(RoleConstants.MANAGER_DEMO))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Solo gli amministratori possono vedere i profili del tenant");
        }

        if (!adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN) && !java.util.Objects.equals(adminProfile.getTenantId(), tenantId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Non puoi vedere i profili di un altro tenant");
        }

        // MANAGER_DEMO can only see employees of their own department
        if (adminProfile.getRole().getId().equals(RoleConstants.MANAGER_DEMO)) {
            Long deptId = adminProfile.getDepartmentId();
            if (deptId == null) {
                return Page.empty(pageable);
            }
            Page<Profile> deptProfiles = profileRepository.findByTenantIdAndDepartmentId(tenantId, deptId, pageable);
            return mapPageToDTO(deptProfiles);
        }

        Page<Profile> profiles = profileRepository.findByTenantId(tenantId, pageable);
        return mapPageToDTO(profiles);
    }

    @Override
    public Page<ProfileDTO> getAllProfiles(UUID adminUserId, Pageable pageable) {
        Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, ERR_ADMIN_PROFILE_NOT_FOUND));

        if (adminProfile.getRole() == null || !adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Solo i superadmin possono vedere tutti i profili");
        }

        Page<Profile> profiles = profileRepository.findAll(pageable);
        return mapPageToDTO(profiles);
    }

    private Page<ProfileDTO> mapPageToDTO(Page<Profile> profiles) {
        // Collect all IDs needed for lookups
        java.util.Set<Long> tenantIds = new java.util.HashSet<>();
        java.util.Set<Long> deptIds = new java.util.HashSet<>();
        java.util.Set<Long> locIds = new java.util.HashSet<>();

        for (Profile p : profiles) {
            if (p.getTenantId() != null) tenantIds.add(p.getTenantId());
            if (p.getDepartmentId() != null) deptIds.add(p.getDepartmentId());
            if (p.getLocationId() != null) locIds.add(p.getLocationId());
        }

        // Bulk fetch all relevant entities
        java.util.Map<Long, Tenant> tenantMap = tenantIds.isEmpty() ? java.util.Collections.emptyMap() :
                tenantRepository.findAllById(tenantIds).stream()
                        .collect(java.util.stream.Collectors.toMap(Tenant::getId, java.util.function.Function.identity()));

        java.util.Map<Long, Department> deptMap = deptIds.isEmpty() ? java.util.Collections.emptyMap() :
                departmentRepository.findAllById(deptIds).stream()
                        .collect(java.util.stream.Collectors.toMap(Department::getId, java.util.function.Function.identity()));

        java.util.Map<Long, Location> locMap = locIds.isEmpty() ? java.util.Collections.emptyMap() :
                locationRepository.findAllById(locIds).stream()
                        .collect(java.util.stream.Collectors.toMap(Location::getId, java.util.function.Function.identity()));

        return profiles.map(p -> mapToDTO(p, 
                tenantMap.get(p.getTenantId()), 
                deptMap.get(p.getDepartmentId()), 
                locMap.get(p.getLocationId())));
    }

    @Override
    @Transactional
    public void updateProfileRole(UUID profileId, Long roleId, UUID adminUserId) {
        Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, ERR_ADMIN_PROFILE_NOT_FOUND));

        if (adminProfile.getRole() == null || 
            (!adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN) && 
             !adminProfile.getRole().getId().equals(RoleConstants.ADMIN_TENANT))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Access denied");
        }

        Profile targetProfile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Target profile not found"));

        if (!adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN) && 
            !java.util.Objects.equals(targetProfile.getTenantId(), adminProfile.getTenantId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "User does not belong to your tenant");
        }

        Role newRole = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Role not found"));

        targetProfile.setRole(newRole);
        profileRepository.save(targetProfile);
    }

    @Override
    @Transactional
    public void deleteProfile(UUID profileId, UUID adminUserId) {
        Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, ERR_ADMIN_PROFILE_NOT_FOUND));

        if (adminProfile.getRole() == null
                || (!adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN)
                        && !adminProfile.getRole().getId().equals(RoleConstants.ADMIN_TENANT))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Solo gli amministratori possono eliminare dipendenti");
        }

        Profile targetProfile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Profilo non trovato"));

        // Tenant admin can only delete profiles in own tenant; superadmin can delete any
        if (!adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN)
                && !java.util.Objects.equals(adminProfile.getTenantId(), targetProfile.getTenantId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Non puoi eliminare un dipendente di un altro tenant");
        }

        // Prevent self-deletion
        if (adminUserId.equals(profileId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Non puoi eliminare il tuo stesso profilo");
        }
        
        attendanceRepository.deleteByUserId(targetProfile.getId());
        inviteLinkRepository.deleteBySenderIdOrManagerId(targetProfile.getId());
        profileRepository.nullifyManagerId(targetProfile.getId());
        profileRepository.delete(targetProfile);
    }

    private ProfileDTO mapToDTO(Profile profile) {
        return mapToDTO(profile, null, null, null);
    }

    private ProfileDTO mapToDTO(Profile profile, Tenant preFetchedTenant, Department preFetchedDept, Location preFetchedLoc) {
        String tenantName = "Unknown Tenant";
        String tenantStatus = null;
        
        Tenant tenant = preFetchedTenant;
        if (tenant == null && profile.getTenantId() != null) {
            tenant = tenantRepository.findById(profile.getTenantId()).orElse(null);
        }
        
        if (tenant != null) {
            tenantName = tenant.getName();
            tenantStatus = tenant.getStatus() != null ? tenant.getStatus().name() : null;
        }

        String departmentName = null;
        Department dept = preFetchedDept;
        if (dept == null && profile.getDepartmentId() != null) {
            dept = departmentRepository.findById(profile.getDepartmentId()).orElse(null);
        }
        
        if (dept != null) {
            departmentName = dept.getName();
        }

        String locationName = null;
        Location loc = preFetchedLoc;
        if (loc == null && profile.getLocationId() != null) {
            loc = locationRepository.findById(profile.getLocationId()).orElse(null);
        }
        
        if (loc != null) {
            locationName = loc.getName();
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
                .avatarUrl(profile.getAvatarUrl())
                .roleDescription(profile.getRoleDescription())
                .allowOvertime(profile.getAllowOvertime())
                .build();
    }

    @Override
    @Transactional
    public String updateAvatar(UUID userId, String avatarUrl) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, ERR_PROFILE_NOT_FOUND + userId));

        // --- Security Check: SSRF & Redirect Prevention ---
        try {
            java.net.URI uri = new java.net.URI(avatarUrl);
            java.net.URI baseUri = new java.net.URI(supabaseUrl);

            // 1. Must be a valid HTTPS URL
            // 2. Host must exactly match the authorized Supabase host
            // 3. Must point to the public storage path
            if (!"https".equalsIgnoreCase(uri.getScheme()) ||
                    !baseUri.getHost().equalsIgnoreCase(uri.getHost()) ||
                    uri.getPath() == null ||
                    !uri.getPath().startsWith("/storage/v1/object/public/")) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "URL avatar non valido o non autorizzato");
            }
        } catch (java.net.URISyntaxException e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Formato URL avatar non valido");
        }

        profile.setAvatarUrl(avatarUrl);
        profileRepository.save(profile);

        return avatarUrl;
    }

    @Override
    @Transactional
    public void updatePhone(UUID userId, String phone) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, ERR_PROFILE_NOT_FOUND + userId));

        profile.setProfileCellphone(phone == null || phone.isBlank() ? null : phone.trim());
        profileRepository.save(profile);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void createProfile(UUID userId, com.athena.common.dto.ProfileSetupRequest request) {
        java.util.Optional<Profile> existing = profileRepository.findById(userId);

        if (existing.isPresent() && (existing.get().getTenantId() != null || existing.get().getRole() != null)) {
            // Profilo già esistente e configurato. Evitiamo il re-setup e il consumo di
            // token.
            return;
        }

        Profile profile = existing.orElse(new Profile());
        profile.setId(userId);
        profile.setFullName(request.getFullName());

        if (request.getInviteToken() != null && !request.getInviteToken().isBlank()) {
            // Registration via Invite Link
            com.athena.common.dto.InviteLinkDTO invite = inviteLinkService.validateToken(request.getInviteToken());

            profile.setTenantId(invite.getTenantId());
            profile.setManagerId(invite.getManagerId());
            profile.setDepartmentId(invite.getDepartmentId());

            // Assign EMPLOYEE role (ID 4)
            Role employeeRole = roleRepository.findById(RoleConstants.EMPLOYEE)
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
            try {
                tenant = tenantRepository.save(tenant);
                tenantRepository.flush();
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "A company with this name is already registered");
            }

            profile.setTenantId(tenant.getId());

            // Assign ADMIN_TENANT role (ID 2)
            Role adminRole = roleRepository.findById(RoleConstants.ADMIN_TENANT)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Role AMMINISTRATORE_TENANT not found"));
            profile.setRole(adminRole);
        }

        profileRepository.save(profile);
    }
}
