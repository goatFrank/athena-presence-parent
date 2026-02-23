package com.athena.attendance.service;

import com.athena.attendance.entity.Attendance;
import com.athena.common.dto.AttendanceDTO;
import com.athena.common.dto.ResponseDTO;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AttendanceService {

    /**
     * Registra o aggiorna la presenza di un utente per una specifica data.
     */
    ResponseDTO<Attendance> saveAttendance(AttendanceDTO dto);

    /**
     * Recupera lo stato di presenza di un dipartimento specifico per una data.
     */
    ResponseDTO<List<Attendance>> getTeamPresence(Long tenantId, Long departmentId, LocalDate date);

    /**
     * Recupera lo stato di presenza di tutto il tenant per una data.
     */
    ResponseDTO<List<Attendance>> getTenantPresence(Long tenantId, LocalDate date);

    /**
     * Recupera lo storico delle presenze di un singolo utente.
     */
    ResponseDTO<List<Attendance>> getUserHistory(UUID userId);
}