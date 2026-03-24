package com.athena.common.dto;

import com.athena.common.enums.WorkMode;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO used for WebSocket broadcasts.
 * Strips sensitive fields (note, createdAt) from the Attendance entity
 * before sending to all topic subscribers.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceBroadcastDTO {

    private Long id;
    private UUID userId;
    private Long tenantId;
    private Long departmentId;
    private LocalDate workDate;
    private WorkMode status;
}
