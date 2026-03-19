package com.athena.attendance.service;

import com.athena.common.dto.ProfileDTO;
import java.util.UUID;

public interface ProfileService {
    ProfileDTO getProfile(UUID userId);
    java.util.List<ProfileDTO> getProfilesByTenant(Long tenantId, UUID adminUserId);
    java.util.List<ProfileDTO> getAllProfiles(UUID adminUserId);
    void deleteProfile(UUID profileId, UUID adminUserId);

    String updateAvatar(UUID userId, String avatarUrl);

    void createProfile(UUID userId, com.athena.common.dto.SignupRequest request);
}
