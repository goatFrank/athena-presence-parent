package com.athena.attendance.service.impl;

import com.athena.attendance.entity.InviteLink;
import com.athena.attendance.entity.Profile;
import com.athena.attendance.entity.Tenant;
import com.athena.attendance.repository.DepartmentRepository;
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
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public InviteLinkDTO generateInviteLink(UUID adminUserId, InviteLinkRequest request) {
        Profile adminProfile = profileRepository.findById(adminUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin profile not found"));

        validateAdminPrivileges(adminProfile);
        
        Long tenantId = adminProfile.getTenantId();
        validateTenantPresence(tenantId);

        OffsetDateTime expiresAt = calculateExpiration(request.getExpiresInDays());
        validateManager(request.getManagerId(), adminProfile.getTenantId(), adminProfile.getRole().getId());
        validateDepartment(request.getDepartmentId(), tenantId, adminProfile.getRole().getId());

        InviteLink inviteLink = InviteLink.builder()
                .token(UUID.randomUUID().toString())
                .tenantId(tenantId)
                .senderId(adminUserId)
                .managerId(request.getManagerId())
                .departmentId(request.getDepartmentId())
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
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token mancante");
        }

        InviteLink inviteLink = inviteLinkRepository.findByToken(token.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Il link di invito non è valido"));

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
        // Use Pessimistic Write Lock to prevent race conditions during usedCount increment
        InviteLink inviteLink = inviteLinkRepository.findWithLockByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Token non valido"));

        // Re-validate inside the lock
        if (!inviteLink.isActive()) {
            throw new ResponseStatusException(HttpStatus.GONE, "Token disattivato");
        }
        if (inviteLink.getExpiresAt() != null && inviteLink.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Token scaduto");
        }
        if (inviteLink.getMaxUses() != null && inviteLink.getUsedCount() >= inviteLink.getMaxUses()) {
            throw new ResponseStatusException(HttpStatus.GONE, "Token non più utilizzabile (limite raggiunto)");
        }

        inviteLink.setUsedCount(inviteLink.getUsedCount() + 1);
        if (inviteLink.getMaxUses() != null && inviteLink.getUsedCount() >= inviteLink.getMaxUses()) {
            inviteLink.setActive(false);
        }
        inviteLinkRepository.save(inviteLink);
    }

    private void validateAdminPrivileges(Profile adminProfile) {
        if (adminProfile.getRole() == null || 
            (!adminProfile.getRole().getId().equals(1L) && 
             !adminProfile.getRole().getId().equals(2L))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non hai i permessi per generare link di invito");
        }
    }

    private void validateTenantPresence(Long tenantId) {
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Impossibile generare un link di invito: nessun tenant associato al profilo");
        }
    }

    private OffsetDateTime calculateExpiration(Integer expiresInDays) {
        return expiresInDays != null ? OffsetDateTime.now().plusDays(expiresInDays) : null;
    }

    private void validateManager(UUID managerId, Long adminTenantId, Long adminRoleId) {
        if (managerId != null) {
            Profile managerProfile = profileRepository.findById(managerId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Manager profile not found"));
            
            if (managerProfile.getRole() == null || !managerProfile.getRole().getId().equals(3L)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'utente selezionato non ha il ruolo di Manager");
            }
            
            if (!adminTenantId.equals(managerProfile.getTenantId()) && !adminRoleId.equals(1L)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Il manager deve appartenere allo stesso tenant");
            }
        }
    }

    private void validateDepartment(Long departmentId, Long tenantId, Long adminRoleId) {
        if (departmentId != null) {
            com.athena.attendance.entity.Department department = departmentRepository.findById(departmentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dipartimento non trovato"));

            if (!tenantId.equals(department.getTenantId()) && !adminRoleId.equals(1L)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Il dipartimento deve appartenere allo stesso tenant");
            }
        }
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

        String departmentName = null;
        if (inviteLink.getDepartmentId() != null) {
            departmentName = departmentRepository.findById(inviteLink.getDepartmentId())
                    .map(com.athena.attendance.entity.Department::getName)
                    .orElse(null);
        }

        return InviteLinkDTO.builder()
                .token(inviteLink.getToken())
                .tenantId(inviteLink.getTenantId())
                .tenantName(tenantName)
                .managerId(inviteLink.getManagerId())
                .managerName(managerName)
                .departmentId(inviteLink.getDepartmentId())
                .departmentName(departmentName)
                .expiresAt(inviteLink.getExpiresAt())
                .maxUses(inviteLink.getMaxUses())
                .usedCount(inviteLink.getUsedCount())
                .active(inviteLink.isActive())
                .build();
    }
}
