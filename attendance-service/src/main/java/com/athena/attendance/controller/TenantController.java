package com.athena.attendance.controller;

import com.athena.attendance.service.TenantService;
import com.athena.common.dto.ResponseDTO;
import com.athena.common.dto.TenantDTO;
import com.athena.common.enums.ResponseStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
@Tag(name = "Tenants", description = "API per la gestione dei Tenant")
public class TenantController {

    private final TenantService tenantService;

    @GetMapping("/all")
    @Operation(summary = "Recupera la lista di tutti i tenant")
    public ResponseEntity<ResponseDTO<List<TenantDTO>>> getAllTenants() {
        List<TenantDTO> tenants = tenantService.getAllTenants();
        return ResponseEntity.ok(ResponseDTO.<List<TenantDTO>>builder()
                .message("All tenants retrieved successfully")
                .payload(tenants)
                .status(ResponseStatus.SUCCESS)
                .build());
    }

    @GetMapping("/pending")
    @Operation(summary = "Recupera la lista dei tenant in attesa di approvazione")
    public ResponseEntity<ResponseDTO<List<TenantDTO>>> getPendingTenants() {
        List<TenantDTO> tenants = tenantService.getPendingTenants();
        return ResponseEntity.ok(ResponseDTO.<List<TenantDTO>>builder()
                .message("Pending tenants retrieved successfully")
                .payload(tenants)
                .status(ResponseStatus.SUCCESS)
                .build());
    }

    @PutMapping("/{id}/approve")
    @Operation(summary = "Approva un tenant")
    public ResponseEntity<ResponseDTO<Void>> approveTenant(@PathVariable Long id) {
        tenantService.updateTenantStatus(id, "ACTIVE");
        return ResponseEntity.ok(ResponseDTO.<Void>builder()
                .message("Tenant approved successfully")
                .status(ResponseStatus.SUCCESS)
                .build());
    }

    @PutMapping("/{id}/reject")
    @Operation(summary = "Rifiuta un tenant")
    public ResponseEntity<ResponseDTO<Void>> rejectTenant(@PathVariable Long id) {
        tenantService.updateTenantStatus(id, "REJECTED");
        return ResponseEntity.ok(ResponseDTO.<Void>builder()
                .message("Tenant rejected successfully")
                .status(ResponseStatus.SUCCESS)
                .build());
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Aggiorna lo stato di un tenant")
    public ResponseEntity<ResponseDTO<Void>> updateTenantStatus(
            @PathVariable Long id, 
            @RequestParam String status) {
        tenantService.updateTenantStatus(id, status);
        return ResponseEntity.ok(ResponseDTO.<Void>builder()
                .message("Tenant status updated successfully to " + status)
                .status(ResponseStatus.SUCCESS)
                .build());
    }
}

