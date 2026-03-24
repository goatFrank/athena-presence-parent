package com.athena.attendance.service;

import com.athena.attendance.entity.TenantStatus;
import com.athena.common.dto.TenantDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;
 
public interface TenantService {
    Page<TenantDTO> getAllTenants(UUID adminUserId, Pageable pageable);
    Page<TenantDTO> getPendingTenants(UUID adminUserId, Pageable pageable);
    void updateTenantStatus(Long tenantId, TenantStatus status, UUID adminUserId);
}
