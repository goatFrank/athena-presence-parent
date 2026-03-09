package com.athena.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDTO {
    private UUID id;
    private String fullName;
    private String role;
    private Long tenantId;
    private Long departmentId;
    private String tenantName; // Added for convenience
    private String departmentName; // Added for convenience
    private Long locationId;
    private String locationName; // Added for convenience
    private String profileCellphone;
}
