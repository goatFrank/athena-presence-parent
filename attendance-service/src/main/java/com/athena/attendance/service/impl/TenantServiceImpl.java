package com.athena.attendance.service.impl;

import com.athena.attendance.entity.Tenant;
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

    private TenantDTO mapToDTO(Tenant tenant) {
        return TenantDTO.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .build();
    }
}

