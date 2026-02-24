package com.athena.attendance.service.impl;

import com.athena.attendance.entity.Department;
import com.athena.attendance.entity.Profile;
import com.athena.attendance.entity.Tenant;
import com.athena.attendance.repository.DepartmentRepository;
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

        return ProfileDTO.builder()
                .id(profile.getId())
                .fullName(profile.getFullName())
                .role(profile.getRole() != null ? profile.getRole().getName() : null)
                .tenantId(profile.getTenantId())
                .departmentId(profile.getDepartmentId())
                .tenantName(tenantName)
                .departmentName(departmentName)
                .build();
    }
}

