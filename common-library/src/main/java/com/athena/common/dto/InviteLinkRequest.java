package com.athena.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteLinkRequest {
    @NotNull(message = "Days until expiration is required")
    @Min(value = 1, message = "Days until expiration must be at least 1")
    @Max(value = 365, message = "Expiration cannot exceed 365 days")
    private Integer expiresInDays;
    
    @NotNull(message = "Max uses is required")
    @Min(value = 1, message = "Max uses must be at least 1")
    @Max(value = 1000, message = "Max uses cannot exceed 1000")
    private Integer maxUses;
    private UUID managerId;
    private Long departmentId;
}
