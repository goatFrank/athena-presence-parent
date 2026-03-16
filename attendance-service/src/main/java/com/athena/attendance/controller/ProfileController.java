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

    @org.springframework.web.bind.annotation.PostMapping("/me/avatar")
    @Operation(summary = "Aggiorna l'URL dell'avatar dopo l'upload su Storage")
    public ResponseEntity<ResponseDTO<String>> updateAvatar(
            @AuthenticationPrincipal Jwt jwt, 
            @org.springframework.web.bind.annotation.RequestBody com.athena.common.dto.AvatarUrlUpdateRequest request) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String publicUrl = profileService.updateAvatar(userId, request.getAvatarUrl());
        return ResponseEntity.ok(ResponseDTO.<String>builder()
                .message("Avatar updated successfully")
                .payload(publicUrl)
                .status(ResponseStatus.SUCCESS)
                .build());
    }

    @org.springframework.web.bind.annotation.PostMapping("/setup")
    @Operation(summary = "Inizializza il profilo e il tenant dell'utente")
    public ResponseEntity<ResponseDTO<Void>> setupProfile(
            @org.springframework.web.bind.annotation.RequestBody com.athena.common.dto.SignupRequest request,
            @org.springframework.web.bind.annotation.RequestParam UUID userId) {
        profileService.createProfile(userId, request.getFullName(), request.getCompanyName());
        return ResponseEntity.ok(ResponseDTO.<Void>builder()
                .message("Profile and Tenant setup successfully")
                .status(ResponseStatus.SUCCESS)
                .build());
    }
}

