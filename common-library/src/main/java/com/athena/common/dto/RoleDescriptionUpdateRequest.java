package com.athena.common.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleDescriptionUpdateRequest {
    @Size(max = 255, message = "La descrizione del ruolo non può superare i 255 caratteri")
    private String roleDescription;
}
