package com.athena.attendance.controller;

import com.athena.attendance.service.ProfileService;
import com.athena.common.dto.ProfileDTO;
import com.athena.common.dto.ResponseDTO;
import com.athena.common.enums.ResponseStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
@Tag(name = "Profiles", description = "API per la gestione del Profilo Utente")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    @Operation(summary = "Recupera il profilo dell'utente loggato")
    public ResponseEntity<ResponseDTO<ProfileDTO>> getMyProfile(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        ProfileDTO profile = profileService.getProfile(userId);
        return ResponseEntity.ok(ResponseDTO.<ProfileDTO>builder()
                .message("Profile retrieved successfully")
                .payload(profile)
                .status(ResponseStatus.SUCCESS)
                .build());
    }
}

