package com.athena.attendance.controller;

import com.athena.attendance.service.TenantService;
import com.athena.common.dto.ResponseDTO;
import com.athena.common.dto.TenantDTO;
import com.athena.common.enums.ResponseStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
@Tag(name = "Tenants", description = "API per la gestione dei Tenant")
public class TenantController {

    private final TenantService tenantService;

    @GetMapping
    @Operation(summary = "Recupera la lista di tutti i tenant")
    public ResponseEntity<ResponseDTO<List<TenantDTO>>> getAllTenants() {
        List<TenantDTO> tenants = tenantService.getAllTenants();
        return ResponseEntity.ok(ResponseDTO.<List<TenantDTO>>builder()
                .message("Tenants retrieved successfully")
                .payload(tenants)
                .status(ResponseStatus.SUCCESS)
                .build());
    }
}

