package com.athena.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Min;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteLinkRequest {
    @Min(value = 1, message = "Days until expiration must be at least 1")
    private Integer expiresInDays;
    
    @Min(value = 1, message = "Max uses must be at least 1")
    private Integer maxUses;
    private UUID managerId;
    private Long departmentId;
}
