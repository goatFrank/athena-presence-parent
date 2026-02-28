package com.athena.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private int officeDays;
    private int remoteDays;
    private int totalWorkingDays;
    private int teamPresencePercentage;
}
