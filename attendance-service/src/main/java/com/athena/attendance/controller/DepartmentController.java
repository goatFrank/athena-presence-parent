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
    public ResponseEntity<ResponseDTO<List<DepartmentDTO>>> getDepartments(@RequestParam(required = false) Long tenantId) {
        List<DepartmentDTO> departments = departmentService.getDepartmentsByTenant(tenantId);

        // NOTA: Aggiungiamo.<List<DepartmentDTO>> prima di builder()
        return ResponseEntity.ok(ResponseDTO.<List<DepartmentDTO>>builder()
                .status(ResponseStatus.SUCCESS)
                .payload(departments)
                .message("Departments retrieved successfully")
                .build());
    }
}



