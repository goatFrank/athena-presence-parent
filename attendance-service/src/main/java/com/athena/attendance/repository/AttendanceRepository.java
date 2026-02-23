package com.athena.attendance.repository;

import com.athena.attendance.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {

    // Trova tutte le presenze di un'azienda per una data specifica
    List<Attendance> findByTenantIdAndWorkDate(UUID tenantId, LocalDate workDate);

    // Trova la cronologia di un singolo utente
    List<Attendance> findByUserIdOrderByWorkDateDesc(UUID userId);

    // Verifica se esiste già una registrazione per l'utente in quel giorno
    boolean existsByUserIdAndWorkDate(UUID userId, LocalDate workDate);

    Optional<Attendance> findByUserIdAndWorkDate(UUID userId, LocalDate workDate);
}