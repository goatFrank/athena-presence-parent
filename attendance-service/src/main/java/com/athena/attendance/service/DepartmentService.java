package com.athena.attendance.service;

import com.athena.common.dto.DepartmentDTO;
import java.util.List;

public interface DepartmentService {
    List<DepartmentDTO> getAllDepartments();
    List<DepartmentDTO> getDepartmentsByTenant(Long tenantId);
}

