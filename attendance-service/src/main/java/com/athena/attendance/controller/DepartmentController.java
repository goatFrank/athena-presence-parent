package com.athena.attendance.controller;


import java.util.List;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.ResponseEntity;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import com.athena.common.enums.ResponseStatus;
import com.athena.common.dto.ResponseDTO;
import com.athena.common.dto.DepartmentDTO;
import com.athena.attendance.service.DepartmentService;

@Tag(name = "Departments", description = "API per la gestione dei Dipartimenti")
@RequiredArgsConstructor
@RequestMapping("/api/v1/departments")
@RestController
public class DepartmentController {
    private final DepartmentService departmentService;

    @Operation(summary = "Recupera la lista dei dipartimenti, opzionalmente filtrata per tenant")
    @GetMapping
    public ResponseEntity<ResponseDTO<List<DepartmentDTO>>> getDepartments(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt,
            @RequestParam(required = false) Long tenantId) {
        
        java.util.UUID userId = java.util.UUID.fromString(jwt.getSubject());
        List<DepartmentDTO> departments = departmentService.getDepartmentsByTenant(tenantId, userId);

        // NOTA: Aggiungiamo.<List<DepartmentDTO>> prima di builder()
        return ResponseEntity.ok(ResponseDTO.<List<DepartmentDTO>>builder()
                .status(ResponseStatus.SUCCESS)
                .payload(departments)
                .message("Departments retrieved successfully")
                .build());
    }

    @Operation(summary = "Crea un nuovo dipartimento per il tenant dell'operatore loggato")
    @org.springframework.web.bind.annotation.PostMapping
    public ResponseEntity<ResponseDTO<DepartmentDTO>> createDepartment(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt,
            @org.springframework.web.bind.annotation.RequestBody com.athena.common.dto.DepartmentDTO request) {
        
        java.util.UUID adminUserId = java.util.UUID.fromString(jwt.getSubject());
        DepartmentDTO created = departmentService.createDepartment(request.getName(), adminUserId);
        
        return ResponseEntity.ok(ResponseDTO.<DepartmentDTO>builder()
                .status(ResponseStatus.SUCCESS)
                .payload(created)
                .message("Department created successfully")
                .build());
    }

    @Operation(summary = "Assegna una lista di utenti a un dipartimento")
    @org.springframework.web.bind.annotation.PutMapping("/{departmentId}/assign")
    public ResponseEntity<ResponseDTO<Void>> assignUsers(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt,
            @org.springframework.web.bind.annotation.PathVariable Long departmentId,
            @org.springframework.web.bind.annotation.RequestBody java.util.List<java.util.UUID> userIds) {
        
        java.util.UUID adminUserId = java.util.UUID.fromString(jwt.getSubject());
        departmentService.assignUsersToDepartment(departmentId, userIds, adminUserId);
        
        return ResponseEntity.ok(ResponseDTO.<Void>builder()
                .status(ResponseStatus.SUCCESS)
                .message("Users assigned to department successfully")
                .build());
    }

    @Operation(summary = "Rinomina un dipartimento")
    @org.springframework.web.bind.annotation.PutMapping("/{departmentId}")
    public ResponseEntity<ResponseDTO<DepartmentDTO>> renameDepartment(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt,
            @org.springframework.web.bind.annotation.PathVariable Long departmentId,
            @org.springframework.web.bind.annotation.RequestBody com.athena.common.dto.DepartmentDTO request) {
        
        java.util.UUID adminUserId = java.util.UUID.fromString(jwt.getSubject());
        DepartmentDTO renamed = departmentService.renameDepartment(departmentId, request.getName(), adminUserId);
        
        return ResponseEntity.ok(ResponseDTO.<DepartmentDTO>builder()
                .status(ResponseStatus.SUCCESS)
                .payload(renamed)
                .message("Department renamed successfully")
                .build());
    }

    @Operation(summary = "Elimina un dipartimento")
    @org.springframework.web.bind.annotation.DeleteMapping("/{departmentId}")
    public ResponseEntity<ResponseDTO<Void>> deleteDepartment(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt,
            @org.springframework.web.bind.annotation.PathVariable Long departmentId) {
        
        java.util.UUID adminUserId = java.util.UUID.fromString(jwt.getSubject());
        departmentService.deleteDepartment(departmentId, adminUserId);
        
        return ResponseEntity.ok(ResponseDTO.<Void>builder()
                .status(ResponseStatus.SUCCESS)
                .message("Department deleted successfully")
                .build());
    }
}



