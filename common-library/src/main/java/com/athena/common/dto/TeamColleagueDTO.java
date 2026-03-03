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
public class TeamColleagueDTO {
    private UUID id;
    private String fullName;
    private String avatarUrl;
    private String workStatus; // 'office', 'remote', or 'leave'
    private String locationDetails;
    private String roleDescription;
}
