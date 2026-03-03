package com.athena.attendance.repository;

import com.athena.attendance.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    Optional<Profile> findById(UUID id);

    List<Profile> findByTenantId(Long tenantId);

    List<Profile> findByTenantIdAndDepartmentId(Long tenantId, Long departmentId);

    int countByTenantIdAndDepartmentId(Long tenantId, Long departmentId);
}
