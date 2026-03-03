package com.athena.attendance.repository;

import com.athena.attendance.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

        // Trova se esiste un record per quel giorno e utente specifico
        // (usato per decidere se fare insert o update)
        Optional<Attendance> findByUserIdAndWorkDate(UUID userId, LocalDate workDate);

        // Trova tutte le presenze di un'azienda per una data specifica
        List<Attendance> findByTenantIdAndWorkDate(Long tenantId, LocalDate workDate);

        List<Attendance> findByWorkDate(LocalDate workDate);

        // Trova la cronologia di un singolo utente
        List<Attendance> findByUserIdOrderByWorkDateDesc(UUID userId);

        // Trova le presenze di un singolo utente in un intervallo di date
        List<Attendance> findByUserIdAndWorkDateBetweenOrderByWorkDateAsc(UUID userId, LocalDate startDate,
                        LocalDate endDate);

        // Trova tutte le presenze di un dipartimento per una data specifica
        List<Attendance> findByTenantIdAndDepartmentIdAndWorkDate(Long tenantId, Long departmentId, LocalDate workDate);

        // Conta le presenze di un utente per uno status e in un intervallo di date
        int countByUserIdAndStatusAndWorkDateBetween(UUID userId, String status, LocalDate startDate,
                        LocalDate endDate);

        // Conta i membri di un dipartimento presenti in ufficio oggi
        int countByTenantIdAndDepartmentIdAndStatusAndWorkDate(Long tenantId, Long departmentId, String status,
                        LocalDate workDate);
}
