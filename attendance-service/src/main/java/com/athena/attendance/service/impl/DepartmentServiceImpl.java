package com.athena.attendance.service.impl;

import com.athena.attendance.entity.Department;
import com.athena.attendance.repository.DepartmentRepository;
import com.athena.attendance.service.DepartmentService;
import com.athena.common.dto.DepartmentDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Override
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DepartmentDTO> getDepartmentsByTenant(Long tenantId) {
        if(tenantId != null) {
            return departmentRepository.findByTenantId(tenantId).stream()
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());
        }
        return getAllDepartments();
    }

    private DepartmentDTO mapToDTO(Department dept) {
        return DepartmentDTO.builder()
                .id(dept.getId())
                .name(dept.getName())
                .tenantId(dept.getTenantId())
                .build();
    }
}

