package com.athena.attendance.service.impl;

import com.athena.attendance.entity.Tenant;
import com.athena.attendance.entity.TenantStatus;
import com.athena.attendance.repository.ProfileRepository;
import com.athena.attendance.repository.TenantRepository;
import com.athena.attendance.service.TenantService;
import com.athena.common.dto.TenantDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final ProfileRepository profileRepository;

    @Override
    public List<TenantDTO> getAllTenants(UUID adminUserId) {
        verificaSuperAdmin(adminUserId);
        return tenantRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<TenantDTO> getPendingTenants(UUID adminUserId) {
        verificaSuperAdmin(adminUserId);
        return tenantRepository.findByStatus(TenantStatus.PENDING).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void updateTenantStatus(Long tenantId, String status, UUID adminUserId) {
        verificaSuperAdmin(adminUserId);

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Tenant non trovato: " + tenantId));

        TenantStatus newStatus = TenantStatus.valueOf(status.toUpperCase());

        tenant.setStatus(newStatus);
        tenantRepository.save(tenant);
    }

    // --- Helper privato ---

    private void verificaSuperAdmin(UUID userId) {
        com.athena.attendance.entity.Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Profilo non trovato"));

        if (profile.getRole() == null || !profile.getRole().getId().equals(1L)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Accesso negato: solo i superadmin possono gestire i tenant");
        }
    }

    private TenantDTO mapToDTO(Tenant tenant) {
        return TenantDTO.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .status(tenant.getStatus() != null ? tenant.getStatus().name() : null)
                .build();
    }
}

