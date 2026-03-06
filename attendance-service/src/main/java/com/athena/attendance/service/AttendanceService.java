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
     * Aggiorna la presenza esistente di un utente per una specifica data. Se il
     * record non esiste, restituisce un errore.
     */
    ResponseDTO<Attendance> updateAttendance(Long id, AttendanceDTO dto, UUID authenticatedUserId);

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

    /**
     * Recupera le presenze di un singolo utente in un intervallo di date.
     */
    ResponseDTO<List<Attendance>> getAttendanceForDateRange(UUID userId, LocalDate startDate, LocalDate endDate);

    /**
     * Calcola le statistiche per la dashboard (giorni ufficio, remoto, % team).
     */
    ResponseDTO<com.athena.common.dto.DashboardStatsDTO> getDashboardStats(UUID userId);

    /**
     * Recupera lo stato di presenza dell'utente per oggi.
     */
    ResponseDTO<Attendance> getMyTodayStatus(UUID userId);

    ResponseDTO<List<com.athena.common.dto.TeamColleagueDTO>> getTeamOverview(UUID userId, String filter, String search,
            LocalDate date);

    /**
     * Cancella una prenotazione specifica.
     * 
     * @param id     L'ID della presenza da cancellare.
     * @param userId L'ID dell'utente che richiede la cancellazione (per verifica
     *               ownership).
     */
    void deleteAttendance(Long id, UUID userId);
}