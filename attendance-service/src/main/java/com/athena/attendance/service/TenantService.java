package com.athena.attendance.service;

import com.athena.common.dto.TenantDTO;
import java.util.List;
import java.util.UUID;

public interface TenantService {
    List<TenantDTO> getAllTenants(UUID adminUserId);
    List<TenantDTO> getPendingTenants(UUID adminUserId);
    void updateTenantStatus(Long tenantId, String status, UUID adminUserId);
}

