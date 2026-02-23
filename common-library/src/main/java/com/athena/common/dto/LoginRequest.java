package com.athena.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Oggetto per la richiesta di autenticazione")
public class LoginRequest {

    @Schema(description = "Indirizzo email dell'utente", example = "test@athena.com", required = true)
    private String email;

    @Schema(description = "Password dell'utente", example = "Password Sicura 123", required = true)
    private String password;
}