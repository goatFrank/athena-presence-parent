package com.athena.attendance.service;

import com.athena.attendance.entity.Attendance;
import com.athena.common.dto.AttendanceDTO;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AttendanceService {

    /**
     * Registra o aggiorna la presenza di un utente per una specifica data.
     */
    Attendance saveAttendance(AttendanceDTO dto);


    /**
     * Recupera lo stato di presenza di tutto il team (tenant) per una data.
     */
    List<Attendance> getTeamPresence(UUID tenantId, LocalDate date);


    /**
     * Recupera lo storico delle presenze di un singolo utente.
     */
    List<Attendance> getUserHistory(UUID userId);
}