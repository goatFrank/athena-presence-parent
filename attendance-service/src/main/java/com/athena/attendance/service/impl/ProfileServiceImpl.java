package com.athena.attendance.service.impl;

import com.athena.attendance.entity.Department;
import com.athena.attendance.entity.Profile;
import com.athena.attendance.entity.Tenant;
import com.athena.attendance.entity.TenantStatus;
import com.athena.attendance.repository.DepartmentRepository;
import com.athena.attendance.repository.LocationRepository;
import com.athena.attendance.repository.ProfileRepository;
import com.athena.attendance.repository.TenantRepository;
import com.athena.attendance.service.ProfileService;
import com.athena.common.dto.ProfileDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final ProfileRepository profileRepository;
    private final TenantRepository tenantRepository;
    private final DepartmentRepository departmentRepository;
    private final LocationRepository locationRepository;

    @Override
    public ProfileDTO getProfile(UUID userId) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Profile not found for user: " + userId));

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
                .tenantId(profile.getTenantId())
                .departmentId(profile.getDepartmentId())
                .tenantName(tenantName)
                .departmentName(departmentName)
                .locationId(profile.getLocationId())
                .locationName(locationName)
                .profileCellphone(profile.getProfileCellphone())
                .tenantStatus(tenantStatus)
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
    public void createProfile(UUID userId, String fullName, String companyName) {
        // 0. Check for existing tenant name
        if (tenantRepository.findByName(companyName).isPresent()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT, "A company with this name is already registered");
        }

        // 1. Create Tenant
        Tenant tenant = new Tenant();
        tenant.setName(companyName);
        tenant.setStatus(TenantStatus.PENDING);
        tenant = tenantRepository.save(tenant);

        // 2. Create Profile
        Profile profile = new Profile();
        profile.setId(userId);
        profile.setFullName(fullName);
        profile.setTenantId(tenant.getId());
        
        profileRepository.save(profile);
    }
}
