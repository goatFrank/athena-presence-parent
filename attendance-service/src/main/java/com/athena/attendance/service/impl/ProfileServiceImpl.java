package com.athena.attendance.service.impl;

import com.athena.attendance.entity.Department;
import com.athena.attendance.entity.Profile;
import com.athena.attendance.entity.Tenant;
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
        if (profile.getTenantId() != null) {
            tenantName = tenantRepository.findById(profile.getTenantId())
                    .map(Tenant::getName)
                    .orElse("Unknown Tenant");
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
}
