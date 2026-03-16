package com.athena.attendance.service;

import com.athena.common.dto.TenantDTO;
import java.util.List;

public interface TenantService {
    List<TenantDTO> getAllTenants();
    List<TenantDTO> getPendingTenants();
    void updateTenantStatus(Long tenantId, String status);
}

