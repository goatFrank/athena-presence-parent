package com.athena.common.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;
import java.util.UUID;

/**
 * Request DTO for assigning users to a department.
 * Limits the list size to prevent abuse and N+1 query storms.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssignUsersRequest {

    @NotNull(message = "User IDs list cannot be null")
    @Size(max = 100, message = "Cannot assign more than 100 users at a time")
    private List<UUID> userIds;
}
