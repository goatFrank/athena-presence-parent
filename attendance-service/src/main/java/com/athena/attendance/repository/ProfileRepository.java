package com.athena.attendance.repository;

import com.athena.attendance.entity.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    Optional<Profile> findById(UUID id);

    Page<Profile> findByTenantId(Long tenantId, Pageable pageable);

    List<Profile> findByTenantId(Long tenantId);

    Page<Profile> findByTenantIdAndDepartmentId(Long tenantId, Long departmentId, Pageable pageable);

    List<Profile> findByTenantIdAndDepartmentId(Long tenantId, Long departmentId);

    int countByTenantIdAndDepartmentId(Long tenantId, Long departmentId);
}
