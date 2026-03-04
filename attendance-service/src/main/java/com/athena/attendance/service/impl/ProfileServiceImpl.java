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
import org.springframework.web.multipart.MultipartFile;

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

    @Override
    public String updateAvatar(UUID userId, MultipartFile file) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Profile not found for user: " + userId));

        if (file.isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "File must be an image");
        }

        try {
            java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads/avatars").toAbsolutePath().normalize();
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = UUID.randomUUID() + extension;
            java.nio.file.Path filePath = uploadDir.resolve(newFilename);

            file.transferTo(filePath.toFile());

            String avatarUrl = "/api/v1/profiles/avatars/" + newFilename;
            profile.setAvatarUrl(avatarUrl);
            profileRepository.save(profile);

            return avatarUrl;
        } catch (java.io.IOException e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Error uploading file", e);
        }
    }
}
