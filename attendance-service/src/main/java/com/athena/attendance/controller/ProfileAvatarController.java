package com.athena.attendance.controller;

import com.athena.attendance.service.ProfileService;
import com.athena.common.dto.ResponseDTO;
import com.athena.common.enums.ResponseStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
@Tag(name = "Profile Avatar", description = "API per la gestione dell'Avatar del Profilo")
public class ProfileAvatarController {

    private final ProfileService profileService;

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Carica o aggiorna l'avatar dell'utente loggato (Max 4MB)")
    public ResponseEntity<ResponseDTO<String>> uploadAvatar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("file") MultipartFile file) {

        UUID userId = UUID.fromString(jwt.getSubject());
        String avatarUrl = profileService.updateAvatar(userId, file);

        return ResponseEntity.ok(ResponseDTO.<String>builder()
                .message("Avatar uploaded successfully")
                .payload(avatarUrl)
                .status(ResponseStatus.SUCCESS)
                .build());
    }

    @GetMapping("/avatars/{filename}")
    @Operation(summary = "Recupera l'immagine dell'avatar")
    public ResponseEntity<Resource> getAvatar(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads/avatars").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = "image/jpeg";
                if (filename.toLowerCase().endsWith(".png")) {
                    contentType = "image/png";
                } else if (filename.toLowerCase().endsWith(".gif")) {
                    contentType = "image/gif";
                } else if (filename.toLowerCase().endsWith(".webp")) {
                    contentType = "image/webp";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Avatar not found");
            }
        } catch (Exception e) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error retrieving avatar", e);
        }
    }
}
