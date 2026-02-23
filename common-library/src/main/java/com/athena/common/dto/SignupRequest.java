package com.athena.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class SignupRequest {
    @Schema(example = "mario.rossi@athena.com")
    private String email;
    @Schema(example = "PasswordSicura123!")
    private String password;
    @Schema(example = "Mario Rossi")
    private String fullName;
}