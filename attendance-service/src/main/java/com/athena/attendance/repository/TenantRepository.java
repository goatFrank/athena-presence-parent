package com.athena.attendance.repository;

import com.athena.attendance.entity.Tenant;
import com.athena.attendance.entity.TenantStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Page<Tenant> findByStatus(TenantStatus status, Pageable pageable);
    List<Tenant> findByStatus(TenantStatus status);
    Optional<Tenant> findByName(String name);
}

