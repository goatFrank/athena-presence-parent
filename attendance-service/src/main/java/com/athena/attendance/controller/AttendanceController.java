package com.athena.attendance.controller;

import com.athena.attendance.entity.Attendance;
import com.athena.attendance.service.AttendanceService;
import com.athena.common.dto.AttendanceDTO;
import com.athena.common.dto.ResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "API per la gestione delle presenze del team")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping
    @Operation(summary = "Registra o aggiorna la presenza giornaliera")
    public ResponseEntity<ResponseDTO<Attendance>> save(@Valid @RequestBody AttendanceDTO dto) {
        ResponseDTO<Attendance> response = attendanceService.saveAttendance(dto);
        return ResponseEntity.status(response.getStatus().getHttpStatus()).body(response);
    }

    @GetMapping("/tenant/{tenantId}")
    @Operation(summary = "Recupera le presenze dell'intero tenant per una data specifica")
    public ResponseEntity<ResponseDTO<List<Attendance>>> getTenantPresence(
            @PathVariable Long tenantId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        ResponseDTO<List<Attendance>> response = attendanceService.getTenantPresence(tenantId, date);
        return ResponseEntity.status(response.getStatus().getHttpStatus()).body(response);
    }

    @GetMapping("/team/{tenantId}/{departmentId}")
    @Operation(summary = "Recupera le presenze di un dipartimento specifico per una data")
    public ResponseEntity<ResponseDTO<List<Attendance>>> getTeamPresence(
            @PathVariable Long tenantId,
            @PathVariable Long departmentId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        ResponseDTO<List<Attendance>> response = attendanceService.getTeamPresence(tenantId, departmentId, date);
        return ResponseEntity.status(response.getStatus().getHttpStatus()).body(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Recupera lo storico delle presenze dell'utente loggato")
    public ResponseEntity<ResponseDTO<List<Attendance>>> getMyHistory(@AuthenticationPrincipal Jwt jwt) {

        UUID authenticatedUserId = UUID.fromString(jwt.getSubject());

        ResponseDTO<List<Attendance>> response = attendanceService.getUserHistory(authenticatedUserId);
        return ResponseEntity.status(response.getStatus().getHttpStatus()).body(response);
    }

    @GetMapping("/me/range")
    @Operation(summary = "Recupera le presenze dell'utente loggato in un range di date")
    public ResponseEntity<ResponseDTO<List<Attendance>>> getMyHistoryRange(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        UUID authenticatedUserId = UUID.fromString(jwt.getSubject());

        ResponseDTO<List<Attendance>> response = attendanceService.getAttendanceForDateRange(authenticatedUserId,
                startDate, endDate);
        return ResponseEntity.status(response.getStatus().getHttpStatus()).body(response);
    }

    @GetMapping("/stats/dashboard")
    @Operation(summary = "Recupera le statistiche per la dashboard (giorni ufficio, remoto, presenza team)")
    public ResponseEntity<ResponseDTO<com.athena.common.dto.DashboardStatsDTO>> getDashboardStats(
            @AuthenticationPrincipal Jwt jwt) {
        UUID authenticatedUserId = UUID.fromString(jwt.getSubject());
        ResponseDTO<com.athena.common.dto.DashboardStatsDTO> response = attendanceService
                .getDashboardStats(authenticatedUserId);
        return ResponseEntity.status(response.getStatus().getHttpStatus()).body(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Annulla una prenotazione")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        UUID authenticatedUserId = UUID.fromString(jwt.getSubject());
        attendanceService.deleteAttendance(id, authenticatedUserId);
        return ResponseEntity.noContent().build();
    }
}