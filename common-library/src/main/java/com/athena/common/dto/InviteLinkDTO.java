package com.athena.common.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteLinkDTO {
    private String token;
    private Long tenantId;
    private String tenantName;
    private UUID managerId;
    private String managerName;
    private Long departmentId;
    private String departmentName;
    private OffsetDateTime expiresAt;
    private Integer maxUses;
    private Integer usedCount;
    private boolean active;
}
