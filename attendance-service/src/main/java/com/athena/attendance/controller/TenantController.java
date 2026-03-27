package com.athena.attendance.controller;

import com.athena.attendance.service.TenantService;
import com.athena.common.dto.ResponseDTO;
import com.athena.common.enums.ResponseStatus;
import com.athena.common.dto.TenantDTO;
import com.athena.attendance.entity.TenantStatus;
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
@Tag(name = "Tenant Management", description = "Endpoints per la gestione dei tenant (aziende)")
public class TenantController {

    private final TenantService tenantService;

    @Operation(summary = "Aggiorna il nome dell'azienda (solo per ADMIN_TENANT o SUPERADMIN)")
    @PutMapping("/me")
    public ResponseEntity<ResponseDTO<Void>> updateMyTenantName(
            @AuthenticationPrincipal Jwt jwt,
            @jakarta.validation.Valid @RequestBody TenantDTO request) {
        
        UUID adminUserId = UUID.fromString(jwt.getSubject());
        tenantService.updateTenantName(request.getName(), adminUserId);
        
        return ResponseEntity.ok(ResponseDTO.<Void>builder()
                .status(ResponseStatus.SUCCESS)
                .message("Company name updated successfully")
                .build());
    }

    @GetMapping("/all")
    @Operation(summary = "Recupera la lista di tutti i tenant (solo superadmin)")
    public ResponseEntity<ResponseDTO<Page<TenantDTO>>> getAllTenants(
            @AuthenticationPrincipal Jwt jwt,
            Pageable pageable) {
        
        UUID adminUserId = UUID.fromString(jwt.getSubject());
        Page<TenantDTO> tenants = tenantService.getAllTenants(adminUserId, pageable);
        
        return ResponseEntity.ok(ResponseDTO.<Page<TenantDTO>>builder()
                .status(ResponseStatus.SUCCESS)
                .payload(tenants)
                .message("Tenants retrieved successfully")
                .build());
    }

    @GetMapping("/pending")
    @Operation(summary = "Recupera la lista dei tenant in attesa di approvazione (solo superadmin)")
    public ResponseEntity<ResponseDTO<Page<TenantDTO>>> getPendingTenants(
            @AuthenticationPrincipal Jwt jwt,
            Pageable pageable) {
        
        UUID adminUserId = UUID.fromString(jwt.getSubject());
        Page<TenantDTO> tenants = tenantService.getPendingTenants(adminUserId, pageable);
        
        return ResponseEntity.ok(ResponseDTO.<Page<TenantDTO>>builder()
                .status(ResponseStatus.SUCCESS)
                .payload(tenants)
                .message("Pending tenants retrieved successfully")
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
                .status(ResponseStatus.SUCCESS)
                .message("Tenant approved successfully")
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
                .status(ResponseStatus.SUCCESS)
                .message("Tenant rejected successfully")
                .build());
    }
}
