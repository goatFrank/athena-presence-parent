package com.athena.attendance.controller;

import com.athena.attendance.service.TenantService;
import com.athena.attendance.entity.TenantStatus;
import com.athena.common.dto.ResponseDTO;
import com.athena.common.dto.TenantDTO;
import com.athena.common.enums.ResponseStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
@Tag(name = "Tenants", description = "API per la gestione dei Tenant")
public class TenantController {

    private final TenantService tenantService;

    @GetMapping("/all")
    @Operation(summary = "Recupera la lista di tutti i tenant (solo superadmin)")
    public ResponseEntity<ResponseDTO<Page<TenantDTO>>> getAllTenants(
            @AuthenticationPrincipal Jwt jwt,
            @org.springframework.data.web.PageableDefault(size = 20) Pageable pageable) {
        UUID adminUserId = UUID.fromString(jwt.getSubject());
        Page<TenantDTO> tenants = tenantService.getAllTenants(adminUserId, pageable);
        return ResponseEntity.ok(ResponseDTO.<Page<TenantDTO>>builder()
                .message("Lista tenant recuperata con successo")
                .payload(tenants)
                .status(ResponseStatus.SUCCESS)
                .build());
    }
 
    @GetMapping("/pending")
    @Operation(summary = "Recupera la lista dei tenant in attesa di approvazione (solo superadmin)")
    public ResponseEntity<ResponseDTO<Page<TenantDTO>>> getPendingTenants(
            @AuthenticationPrincipal Jwt jwt,
            @org.springframework.data.web.PageableDefault(size = 20) Pageable pageable) {
        UUID adminUserId = UUID.fromString(jwt.getSubject());
        Page<TenantDTO> tenants = tenantService.getPendingTenants(adminUserId, pageable);
        return ResponseEntity.ok(ResponseDTO.<Page<TenantDTO>>builder()
                .message("Lista tenant in attesa recuperata con successo")
                .payload(tenants)
                .status(ResponseStatus.SUCCESS)
                .build());
    }

    @PutMapping("/{id}/approve")
    @Operation(summary = "Approva un tenant (solo superadmin)")
    public ResponseEntity<ResponseDTO<Void>> approveTenant(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id) {
        UUID adminUserId = UUID.fromString(jwt.getSubject());
        tenantService.updateTenantStatus(id, TenantStatus.ACTIVE, adminUserId);
        return ResponseEntity.ok(ResponseDTO.<Void>builder()
                .message("Tenant approvato con successo")
                .status(ResponseStatus.SUCCESS)
                .build());
    }

    @PutMapping("/{id}/reject")
    @Operation(summary = "Rifiuta un tenant (solo superadmin)")
    public ResponseEntity<ResponseDTO<Void>> rejectTenant(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id) {
        UUID adminUserId = UUID.fromString(jwt.getSubject());
        tenantService.updateTenantStatus(id, TenantStatus.REJECTED, adminUserId);
        return ResponseEntity.ok(ResponseDTO.<Void>builder()
                .message("Tenant rifiutato con successo")
                .status(ResponseStatus.SUCCESS)
                .build());
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Aggiorna lo stato di un tenant (solo superadmin)")
    public ResponseEntity<ResponseDTO<Void>> updateTenantStatus(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestParam TenantStatus status) {
        UUID adminUserId = UUID.fromString(jwt.getSubject());
        tenantService.updateTenantStatus(id, status, adminUserId);
        return ResponseEntity.ok(ResponseDTO.<Void>builder()
                .message("Stato del tenant aggiornato con successo")
                .status(ResponseStatus.SUCCESS)
                .build());
    }
}

