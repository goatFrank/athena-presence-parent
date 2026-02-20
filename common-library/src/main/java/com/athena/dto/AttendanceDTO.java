package com.athena.dto;

import com.athena.common.WorkMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDTO {
    private UUID userId;        // ID dell'utente (da Supabase Auth)
    private UUID tenantId;      // ID dell'azienda/tenant
    private LocalDate workDate; // Data della presenza
    private WorkMode status;    // OFFICE, REMOTE, etc.
    private String note;        // Note opzionali (es. "Al mattino fuori sede")
}