package com.athena.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {
    @NotBlank
    @Email
    @Schema(example = "mario.rossi@athena.com")
    private String email;
    @NotBlank
    @Schema(example = "PasswordSicura123!")
    private String password;
    @NotBlank
    @Schema(example = "Mario Rossi")
    private String fullName;
    @NotBlank
    @Schema(example = "Athena Inc.")
    private String companyName;

    @Schema(description = "Token opzionale per la registrazione tramite invito")
    private String inviteToken;
}