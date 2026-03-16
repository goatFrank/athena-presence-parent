package com.athena.attendance.service.impl;

import com.athena.attendance.entity.Tenant;
import com.athena.attendance.entity.TenantStatus;
import com.athena.attendance.repository.TenantRepository;
import com.athena.attendance.service.TenantService;
import com.athena.common.dto.TenantDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;

    @Override
    public List<TenantDTO> getAllTenants() {
        return tenantRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<TenantDTO> getPendingTenants() {
        return tenantRepository.findByStatus(TenantStatus.PENDING).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void updateTenantStatus(Long tenantId, String status) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Tenant not found: " + tenantId));
        
        tenant.setStatus(TenantStatus.valueOf(status.toUpperCase()));
        tenantRepository.save(tenant);
    }

    private TenantDTO mapToDTO(Tenant tenant) {
        return TenantDTO.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .status(tenant.getStatus() != null ? tenant.getStatus().name() : null)
                .build();
    }
}

