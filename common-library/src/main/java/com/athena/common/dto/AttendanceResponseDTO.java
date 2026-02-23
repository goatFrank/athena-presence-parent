package com.athena.common.dto;

import com.athena.common.enums.WorkMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponseDTO {

    private Long id;
    private UUID userId;
    private String fullName;
    private Long tenantId;
    private Long departmentId;
    private LocalDate workDate;
    private WorkMode status;
    private String note;
}
