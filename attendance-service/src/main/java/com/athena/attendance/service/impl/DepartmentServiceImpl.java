package com.athena.attendance.service.impl;

import com.athena.attendance.entity.Department;
import com.athena.attendance.repository.DepartmentRepository;
import com.athena.attendance.service.DepartmentService;
import com.athena.common.dto.DepartmentDTO;
import com.athena.common.constants.RoleConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final com.athena.attendance.repository.ProfileRepository profileRepository;
    private final com.athena.attendance.repository.TenantRepository tenantRepository;
    private final com.athena.attendance.repository.LocationRepository locationRepository;
    private final com.athena.attendance.repository.AttendanceRepository attendanceRepository;
    
    private static final String UNKNOWN_TENANT = "Unknown Tenant";

    @Override
    public List<DepartmentDTO> getAllDepartments() {
        List<Department> depts = departmentRepository.findAll();
        
        // Batch fetch all tenants to avoid N+1
        java.util.Set<Long> tenantIds = depts.stream()
                .map(Department::getTenantId)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        
        java.util.Map<Long, String> tenantNameMap = tenantRepository.findAllById(tenantIds).stream()
                .collect(java.util.stream.Collectors.toMap(com.athena.attendance.entity.Tenant::getId, 
                        com.athena.attendance.entity.Tenant::getName));

        return depts.stream()
                .map(dept -> mapToDTO(dept, tenantNameMap.get(dept.getTenantId())))
                .toList();
    }

    @Override
    public List<DepartmentDTO> getDepartmentsByTenant(Long tenantId, java.util.UUID userId) {
        com.athena.attendance.entity.Profile userProfile = profileRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "User profile not found"));

        if (userProfile.getRole() != null && userProfile.getRole().getId().equals(RoleConstants.SUPERADMIN)) {
            if (tenantId != null) {
                // If a tenantId is provided, we filter by it even for Superadmin
                String tenantName = tenantRepository.findById(tenantId)
                        .map(com.athena.attendance.entity.Tenant::getName)
                        .orElse(UNKNOWN_TENANT);
                return departmentRepository.findByTenantId(tenantId).stream()
                        .map(dept -> mapToDTO(dept, tenantName))
                        .toList();
            }
            // If no tenantId provided, Superadmin sees everything
            return getAllDepartments();
        }

        Long effectiveTenantId = userProfile.getTenantId();
        String tenantName = tenantRepository.findById(effectiveTenantId)
                .map(com.athena.attendance.entity.Tenant::getName)
                .orElse(UNKNOWN_TENANT);

        // MANAGER_DEMO can only see their own department
        if (userProfile.getRole() != null && userProfile.getRole().getId().equals(RoleConstants.MANAGER_DEMO)) {
            Long deptId = userProfile.getDepartmentId();
            if (deptId == null) {
                return java.util.Collections.emptyList();
            }
            return departmentRepository.findById(deptId)
                    .map(dept -> List.of(mapToDTO(dept, tenantName)))
                    .orElse(java.util.Collections.emptyList());
        }

        return departmentRepository.findByTenantId(effectiveTenantId).stream()
                .map(dept -> mapToDTO(dept, tenantName))
                .toList();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public DepartmentDTO createDepartment(String name, Long tenantId, Long locationId, String locationName, String locationAddress, java.util.UUID adminUserId) {
        com.athena.attendance.entity.Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Admin profile not found"));

        if (adminProfile.getRole() == null || 
            (!adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN) && 
             !adminProfile.getRole().getId().equals(RoleConstants.ADMIN_TENANT))) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Solo gli amministratori possono creare dipartimenti");
        }

        // Use provided tenantId if Superadmin, otherwise force admin's tenantId
        Long tenantIdToUse = tenantId;
        if (tenantIdToUse == null || !adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN)) {
            tenantIdToUse = adminProfile.getTenantId();
        }
        final Long finalTenantId = tenantIdToUse;

        Long finalLocationId = locationId;
        if (finalLocationId == null && locationName != null && !locationName.trim().isEmpty()) {
            finalLocationId = locationRepository.findByTenantIdAndName(finalTenantId, locationName.trim())
                    .map(com.athena.attendance.entity.Location::getId)
                    .orElseGet(() -> {
                        com.athena.attendance.entity.Location newLoc = new com.athena.attendance.entity.Location();
                        newLoc.setTenantId(finalTenantId);
                        newLoc.setName(locationName.trim());
                        newLoc.setAddress(locationAddress);
                        return locationRepository.save(newLoc).getId();
                    });
        }
 else if (finalLocationId != null && (locationName != null || locationAddress != null)) {
            locationRepository.findById(finalLocationId).ifPresent(loc -> {
                if (locationName != null && !locationName.trim().isEmpty()) loc.setName(locationName.trim());
                if (locationAddress != null) loc.setAddress(locationAddress);
                locationRepository.save(loc);
            });
        }

        Department dept = new Department();
        dept.setName(name);
        dept.setTenantId(finalTenantId);
        dept.setLocationId(finalLocationId);
        
        Department saved = departmentRepository.save(dept);
        
        // Associate location back to department if missing
        if (finalLocationId != null) {
            locationRepository.findById(finalLocationId).ifPresent(loc -> {
                if (loc.getDepartmentId() == null) {
                    loc.setDepartmentId(saved.getId());
                    locationRepository.save(loc);
                }
            });
        }

        return mapToDTO(saved);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public DepartmentDTO updateDepartment(Long departmentId, String name, Long tenantId, Long locationId, String locationName, String locationAddress, java.util.UUID adminUserId) {
        com.athena.attendance.entity.Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Admin profile not found"));

        if (adminProfile.getRole() == null || 
            (!adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN) && 
             !adminProfile.getRole().getId().equals(RoleConstants.ADMIN_TENANT))) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Solo gli amministratori possono modificare dipartimenti");
        }

        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Department not found"));

        boolean isSA = adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN);
        if (!dept.getTenantId().equals(adminProfile.getTenantId()) && !isSA) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Il dipartimento non appartiene al tuo tenant");
        }

        if (name != null) dept.setName(name);
        
        // Allow Superadmin to change tenantId
        if (isSA && tenantId != null) {
            dept.setTenantId(tenantId);
        }
        
        final Long finalTenantId = dept.getTenantId();
        Long finalLocationId = locationId;
        if (finalLocationId == null && locationName != null && !locationName.trim().isEmpty()) {
            finalLocationId = locationRepository.findByTenantIdAndName(finalTenantId, locationName.trim())
                    .map(com.athena.attendance.entity.Location::getId)
                    .orElseGet(() -> {
                        com.athena.attendance.entity.Location newLoc = new com.athena.attendance.entity.Location();
                        newLoc.setTenantId(finalTenantId);
                        newLoc.setName(locationName.trim());
                        newLoc.setAddress(locationAddress);
                        newLoc.setDepartmentId(departmentId);
                        return locationRepository.save(newLoc).getId();
                    });
        }
 else if (finalLocationId != null) {
            final Long locId = finalLocationId;
            locationRepository.findById(locId).ifPresent(loc -> {
                if (locationName != null && !locationName.trim().isEmpty()) loc.setName(locationName.trim());
                if (locationAddress != null) loc.setAddress(locationAddress);
                if (loc.getDepartmentId() == null) loc.setDepartmentId(departmentId);
                locationRepository.save(loc);
            });
        }

        dept.setLocationId(finalLocationId);
        
        Department saved = departmentRepository.save(dept);
        return mapToDTO(saved);
    }


    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deleteDepartment(Long departmentId, java.util.UUID adminUserId) {
        com.athena.attendance.entity.Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Admin profile not found"));

        if (adminProfile.getRole() == null || 
            (!adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN) && 
             !adminProfile.getRole().getId().equals(RoleConstants.ADMIN_TENANT))) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Solo gli amministratori possono eliminare dipartimenti");
        }

        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Department not found"));

        if (!dept.getTenantId().equals(adminProfile.getTenantId()) && !adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Il dipartimento non appartiene al tuo tenant");
        }

        // Remove department association from all profiles
        List<com.athena.attendance.entity.Profile> assignedProfiles = profileRepository.findByTenantIdAndDepartmentId(dept.getTenantId(), departmentId);
        for (com.athena.attendance.entity.Profile p : assignedProfiles) {
            p.setDepartmentId(null);
        }

        // Remove department association from any linked location
        locationRepository.findByDepartmentId(departmentId).ifPresent(loc -> {
            loc.setDepartmentId(null);
            locationRepository.save(loc);
        });

        // Remove department association from all attendance records
        attendanceRepository.findByDepartmentId(departmentId).forEach(att -> {
            att.setDepartmentId(null);
            attendanceRepository.save(att);
        });

        departmentRepository.delete(dept);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void assignUsersToDepartment(Long departmentId, List<java.util.UUID> userIds, java.util.UUID adminUserId) {
        com.athena.attendance.entity.Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Admin profile not found"));

        if (adminProfile.getRole() == null || 
            (!adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN) && 
             !adminProfile.getRole().getId().equals(RoleConstants.ADMIN_TENANT))) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Solo gli amministratori possono assegnare utenti");
        }

        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Department not found"));

        if (!dept.getTenantId().equals(adminProfile.getTenantId()) && !adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Il dipartimento non appartiene al tuo tenant");
        }

        // 1. Batch-fetch the requested profiles and validate all UUIDs exist
        java.util.Set<java.util.UUID> requestedIds = userIds == null
                ? java.util.Collections.emptySet()
                : new java.util.HashSet<>(userIds);

        List<com.athena.attendance.entity.Profile> requestedProfiles = requestedIds.isEmpty()
                ? java.util.Collections.emptyList()
                : profileRepository.findAllById(requestedIds);

        // Fail-fast if any UUID was not found
        if (requestedProfiles.size() != requestedIds.size()) {
            java.util.Set<java.util.UUID> foundIds = requestedProfiles.stream()
                    .map(com.athena.attendance.entity.Profile::getId)
                    .collect(java.util.stream.Collectors.toSet());
            java.util.Set<java.util.UUID> missing = new java.util.HashSet<>(requestedIds);
            missing.removeAll(foundIds);
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Profili non trovati: " + missing);
        }

        // Validate all requested profiles belong to the same tenant (unless superadmin)
        boolean isSuperadmin = adminProfile.getRole().getId().equals(RoleConstants.SUPERADMIN);
        for (com.athena.attendance.entity.Profile p : requestedProfiles) {
            if (!isSuperadmin && !p.getTenantId().equals(dept.getTenantId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "L'utente " + p.getId() + " non appartiene al tenant del dipartimento");
            }
        }

        // 2. Diff-based update: only change what's needed
        List<com.athena.attendance.entity.Profile> currentMembers = profileRepository.findByTenantIdAndDepartmentId(dept.getTenantId(), departmentId);

        // Users to remove: currently assigned but NOT in the new list
        for (com.athena.attendance.entity.Profile p : currentMembers) {
            if (!requestedIds.contains(p.getId())) {
                p.setDepartmentId(null);
            }
        }

        // Users to add: in the new list but NOT currently assigned to this dept
        for (com.athena.attendance.entity.Profile p : requestedProfiles) {
            if (!departmentId.equals(p.getDepartmentId())) {
                p.setDepartmentId(departmentId);
            }
        }
    }

    private DepartmentDTO mapToDTO(Department dept) {
        return mapToDTO(dept, null);
    }

    private DepartmentDTO mapToDTO(Department dept, String preFetchedTenantName) {
        String tenantName = preFetchedTenantName;
        if (tenantName == null && dept.getTenantId() != null) {
            tenantName = tenantRepository.findById(dept.getTenantId())
                    .map(com.athena.attendance.entity.Tenant::getName)
                    .orElse(UNKNOWN_TENANT);
        } else if (tenantName == null) {
            tenantName = UNKNOWN_TENANT;
        }

        String locationName = null;
        String locationAddress = null;
        if (dept.getLocationId() != null) {
            com.athena.attendance.entity.Location loc = locationRepository.findById(dept.getLocationId()).orElse(null);
            if (loc != null) {
                locationName = loc.getName();
                locationAddress = loc.getAddress();
            }
        }

        return DepartmentDTO.builder()
                .id(dept.getId())
                .name(dept.getName())
                .tenantId(dept.getTenantId())
                .tenantName(tenantName)
                .locationId(dept.getLocationId())
                .locationName(locationName)
                .locationAddress(locationAddress)
                .build();
    }
}

