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
        return ResponseEntity.ok(attendanceService.saveAttendance(dto));
    }

    @GetMapping("/tenant/{tenantId}")
    @Operation(summary = "Recupera le presenze dell'intero tenant per una data specifica")
    public ResponseEntity<ResponseDTO<List<Attendance>>> getTenantPresence(
            @PathVariable Long tenantId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getTenantPresence(tenantId, date));
    }

    @GetMapping("/team/{tenantId}/{departmentId}")
    @Operation(summary = "Recupera le presenze di un dipartimento specifico per una data")
    public ResponseEntity<ResponseDTO<List<Attendance>>> getTeamPresence(
            @PathVariable Long tenantId,
            @PathVariable Long departmentId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getTeamPresence(tenantId, departmentId, date));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Recupera lo storico delle presenze di un singolo utente")
    public ResponseEntity<ResponseDTO<List<Attendance>>> getUserHistory(@PathVariable UUID userId) {
        return ResponseEntity.ok(attendanceService.getUserHistory(userId));
    }
}