package com.athena.attendance.service;

import com.athena.common.dto.TenantDTO;
import java.util.List;

public interface TenantService {
    List<TenantDTO> getAllTenants();
}

