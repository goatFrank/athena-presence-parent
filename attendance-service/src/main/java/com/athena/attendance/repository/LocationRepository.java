package com.athena.attendance.repository;

import com.athena.attendance.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    List<Location> findByTenantId(Long tenantId);
    java.util.Optional<Location> findByTenantIdAndName(Long tenantId, String name);
    java.util.Optional<Location> findByDepartmentId(Long departmentId);
}
