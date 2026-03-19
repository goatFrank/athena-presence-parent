package com.athena.attendance.service.impl;

import com.athena.attendance.entity.InviteLink;
import com.athena.attendance.entity.Profile;
import com.athena.attendance.entity.Tenant;
import com.athena.attendance.repository.InviteLinkRepository;
import com.athena.attendance.repository.ProfileRepository;
import com.athena.attendance.repository.TenantRepository;
import com.athena.attendance.service.InviteLinkService;
import com.athena.common.dto.InviteLinkDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.athena.common.dto.InviteLinkRequest;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InviteLinkServiceImpl implements InviteLinkService {

    private final InviteLinkRepository inviteLinkRepository;
    private final ProfileRepository profileRepository;
    private final TenantRepository tenantRepository;

    @Override
    @Transactional
    public InviteLinkDTO generateInviteLink(UUID adminUserId, InviteLinkRequest request) {
        Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin profile not found"));

        // Only tenant admin or superadmin can generate
        if (adminProfile.getRole() == null || (!adminProfile.getRole().getId().equals(1L) && !adminProfile.getRole().getId().equals(3L))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non hai i permessi per generare link di invito");
        }

        OffsetDateTime expiresAt = null;
        if (request.getExpiresInDays() != null) {
            expiresAt = OffsetDateTime.now().plusDays(request.getExpiresInDays());
        }

        // If managerId is provided, verify it exists and has the MANAGER role (ID: 2)
        if (request.getManagerId() != null) {
            Profile managerProfile = profileRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Manager profile not found"));
            
            if (managerProfile.getRole() == null || !managerProfile.getRole().getId().equals(2L)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'utente selezionato non ha il ruolo di Manager");
            }
            
            if (!managerProfile.getTenantId().equals(adminProfile.getTenantId()) && !adminProfile.getRole().getId().equals(1L)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Il manager deve appartenere allo stesso tenant");
            }
        }

        InviteLink inviteLink = InviteLink.builder()
                .token(UUID.randomUUID().toString())
                .tenantId(adminProfile.getTenantId())
                .senderId(adminUserId)
                .managerId(request.getManagerId())
                .createdAt(OffsetDateTime.now())
                .expiresAt(expiresAt)
                .maxUses(request.getMaxUses())
                .usedCount(0)
                .active(true)
                .build();

        inviteLink = inviteLinkRepository.save(inviteLink);
        return mapToDTO(inviteLink);
    }

    @Override
    public InviteLinkDTO validateToken(String token) {
        InviteLink inviteLink = inviteLinkRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Token non valido"));

        if (!inviteLink.isActive()) {
            throw new ResponseStatusException(HttpStatus.GONE, "Token disattivato");
        }

        if (inviteLink.getExpiresAt() != null && inviteLink.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Token scaduto");
        }

        if (inviteLink.getMaxUses() != null && inviteLink.getUsedCount() >= inviteLink.getMaxUses()) {
            throw new ResponseStatusException(HttpStatus.GONE, "Token non più utilizzabile");
        }

        return mapToDTO(inviteLink);
    }

    @Override
    @Transactional
    public void useToken(String token) {
        InviteLink inviteLink = inviteLinkRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Token non valido"));

        inviteLink.setUsedCount(inviteLink.getUsedCount() + 1);
        if (inviteLink.getMaxUses() != null && inviteLink.getUsedCount() >= inviteLink.getMaxUses()) {
            inviteLink.setActive(false);
        }
        inviteLinkRepository.save(inviteLink);
    }

    private InviteLinkDTO mapToDTO(InviteLink inviteLink) {
        String tenantName = tenantRepository.findById(inviteLink.getTenantId())
                .map(Tenant::getName)
                .orElse("Azienda Sconosciuta");

        String managerName = null;
        if (inviteLink.getManagerId() != null) {
            managerName = profileRepository.findById(inviteLink.getManagerId())
                    .map(Profile::getFullName)
                    .orElse(null);
        }

        return InviteLinkDTO.builder()
                .token(inviteLink.getToken())
                .tenantId(inviteLink.getTenantId())
                .tenantName(tenantName)
                .managerId(inviteLink.getManagerId())
                .managerName(managerName)
                .expiresAt(inviteLink.getExpiresAt())
                .maxUses(inviteLink.getMaxUses())
                .usedCount(inviteLink.getUsedCount())
                .active(inviteLink.isActive())
                .build();
    }
}
