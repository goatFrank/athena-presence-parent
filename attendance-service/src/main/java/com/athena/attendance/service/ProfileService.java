package com.athena.attendance.service;

import com.athena.common.dto.ProfileDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface ProfileService {
    ProfileDTO getProfile(UUID userId);
    Page<ProfileDTO> getProfilesByTenant(Long tenantId, UUID adminUserId, Pageable pageable);
    Page<ProfileDTO> getAllProfiles(UUID adminUserId, Pageable pageable);
    void deleteProfile(UUID profileId, UUID adminUserId);

    String updateAvatar(UUID userId, String avatarUrl);

    void createProfile(UUID userId, com.athena.common.dto.SignupRequest request);
}
