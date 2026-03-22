package com.athena.attendance.controller;

import com.athena.attendance.service.InviteLinkService;
import com.athena.common.dto.InviteLinkDTO;
import com.athena.common.dto.ResponseDTO;
import com.athena.common.enums.ResponseStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import com.athena.common.dto.InviteLinkRequest;

@RestController
@RequestMapping("/api/v1/invites")
@RequiredArgsConstructor
@Tag(name = "Invite Links", description = "API per la gestione dei link di invito alla registrazione")
public class InviteLinkController {

    private final InviteLinkService inviteLinkService;

    @PostMapping("/generate")
    @Operation(summary = "Genera un nuovo token di invito (solo Admin/Superadmin)")
    public ResponseEntity<ResponseDTO<InviteLinkDTO>> generateInvite(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody InviteLinkRequest request) {
        
        UUID adminUserId = UUID.fromString(jwt.getSubject());
        InviteLinkDTO invite = inviteLinkService.generateInviteLink(adminUserId, request);
        
        return ResponseEntity.ok(ResponseDTO.<InviteLinkDTO>builder()
                .message("Invite link generated successfully")
                .payload(invite)
                .status(ResponseStatus.SUCCESS)
                .build());
    }

    @GetMapping("/validate/{token}")
    @Operation(summary = "Valida un token di invito e restituisce i dettagli dell'azienda")
    public ResponseEntity<ResponseDTO<InviteLinkDTO>> validateInvite(@PathVariable String token) {
        InviteLinkDTO invite = inviteLinkService.validateToken(token);
        
        return ResponseEntity.ok(ResponseDTO.<InviteLinkDTO>builder()
                .message("Token is valid")
                .payload(invite)
                .status(ResponseStatus.SUCCESS)
                .build());
    }
}
