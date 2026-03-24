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
    private final com.athena.attendance.repository.ProfileRepository profileRepository;
    private final com.athena.attendance.repository.TenantRepository tenantRepository;

    @Override
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DepartmentDTO> getDepartmentsByTenant(Long tenantId, java.util.UUID userId) {
        com.athena.attendance.entity.Profile userProfile = profileRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "User profile not found"));

        // Se è Superadmin (Role ID: 1), può vedere tutto o filtrare per tenant passato
        if (userProfile.getRole() != null && userProfile.getRole().getId().equals(1L)) {
            if (tenantId != null) {
                return departmentRepository.findByTenantId(tenantId).stream()
                        .map(this::mapToDTO)
                        .collect(Collectors.toList());
            }
            return getAllDepartments();
        }

        // Se non è Superadmin, vede SOLO i dipartimenti del proprio tenant
        Long effectiveTenantId = userProfile.getTenantId();
        return departmentRepository.findByTenantId(effectiveTenantId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public DepartmentDTO createDepartment(String name, java.util.UUID adminUserId) {
        com.athena.attendance.entity.Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Admin profile not found"));

        if (adminProfile.getRole() == null || 
            (!adminProfile.getRole().getId().equals(1L) && 
             !adminProfile.getRole().getId().equals(2L) && 
             !adminProfile.getRole().getId().equals(3L))) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Solo gli amministratori possono creare dipartimenti");
        }

        Department dept = new Department();
        dept.setName(name);
        dept.setTenantId(adminProfile.getTenantId());
        
        Department saved = departmentRepository.save(dept);
        return mapToDTO(saved);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public DepartmentDTO renameDepartment(Long departmentId, String newName, java.util.UUID adminUserId) {
        com.athena.attendance.entity.Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Admin profile not found"));

        if (adminProfile.getRole() == null || 
            (!adminProfile.getRole().getId().equals(1L) && 
             !adminProfile.getRole().getId().equals(2L) && 
             !adminProfile.getRole().getId().equals(3L))) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Solo gli amministratori possono rinominare dipartimenti");
        }

        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Department not found"));

        if (!dept.getTenantId().equals(adminProfile.getTenantId()) && !adminProfile.getRole().getId().equals(1L)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Il dipartimento non appartiene al tuo tenant");
        }

        dept.setName(newName);
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
            (!adminProfile.getRole().getId().equals(1L) && 
             !adminProfile.getRole().getId().equals(2L) && 
             !adminProfile.getRole().getId().equals(3L))) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Solo gli amministratori possono eliminare dipartimenti");
        }

        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Department not found"));

        if (!dept.getTenantId().equals(adminProfile.getTenantId()) && !adminProfile.getRole().getId().equals(1L)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Il dipartimento non appartiene al tuo tenant");
        }

        // Remove department association from all profiles
        List<com.athena.attendance.entity.Profile> assignedProfiles = profileRepository.findByTenantIdAndDepartmentId(dept.getTenantId(), departmentId);
        for (com.athena.attendance.entity.Profile p : assignedProfiles) {
            p.setDepartmentId(null);
        }

        departmentRepository.delete(dept);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void assignUsersToDepartment(Long departmentId, List<java.util.UUID> userIds, java.util.UUID adminUserId) {
        com.athena.attendance.entity.Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Admin profile not found"));

        if (adminProfile.getRole() == null || 
            (!adminProfile.getRole().getId().equals(1L) && 
             !adminProfile.getRole().getId().equals(2L) && 
             !adminProfile.getRole().getId().equals(3L))) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Solo gli amministratori possono assegnare utenti");
        }

        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Department not found"));

        if (!dept.getTenantId().equals(adminProfile.getTenantId()) && !adminProfile.getRole().getId().equals(1L)) {
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
        boolean isSuperadmin = adminProfile.getRole().getId().equals(1L);
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
        String tenantName = "Unknown Tenant";
        if (dept.getTenantId() != null) {
            tenantName = tenantRepository.findById(dept.getTenantId())
                    .map(com.athena.attendance.entity.Tenant::getName)
                    .orElse("Unknown Tenant");
        }

        return DepartmentDTO.builder()
                .id(dept.getId())
                .name(dept.getName())
                .tenantId(dept.getTenantId())
                .tenantName(tenantName)
                .build();
    }
}

