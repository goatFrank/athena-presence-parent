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

    // Trova la cronologia di un singolo utente
    List<Attendance> findByUserIdOrderByWorkDateDesc(UUID userId);
}
