package com.athena.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileSetupRequest {
    @NotBlank
    @Email
    @Schema(example = "mario.rossi@athena.com")
    private String email;

    @NotBlank
    @Size(max = 100, message = "Il nome completo non può superare i 100 caratteri")
    @Schema(example = "Mario Rossi")
    private String fullName;

    @Size(max = 100, message = "Il nome dell'azienda non può superare i 100 caratteri")
    @Schema(example = "Athena Inc.")
    private String companyName;

    @Schema(description = "Token opzionale per la registrazione tramite invito")
    private String inviteToken;
}
