package com.athena.attendance.service;

import com.athena.common.dto.ProfileDTO;
import java.util.UUID;

public interface ProfileService {
    ProfileDTO getProfile(UUID userId);
}

