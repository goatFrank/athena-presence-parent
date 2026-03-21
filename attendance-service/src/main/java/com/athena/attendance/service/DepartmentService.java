package com.athena.attendance.service;

import com.athena.common.dto.DepartmentDTO;
import java.util.List;

public interface DepartmentService {
    List<DepartmentDTO> getAllDepartments();
    List<DepartmentDTO> getDepartmentsByTenant(Long tenantId, java.util.UUID userId);
    DepartmentDTO createDepartment(String name, java.util.UUID adminUserId);
    DepartmentDTO renameDepartment(Long departmentId, String newName, java.util.UUID adminUserId);
    void deleteDepartment(Long departmentId, java.util.UUID adminUserId);
    void assignUsersToDepartment(Long departmentId, List<java.util.UUID> userIds, java.util.UUID adminUserId);
}

