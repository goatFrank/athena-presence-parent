package com.athena.common.dto;

import com.athena.common.enums.WorkMode;
import jakarta.validation.constraints.NotNull;
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
    private Long id;

    @NotNull
    private UUID userId;        // ID dell'utente (da Supabase Auth)

    @NotNull
    private Long tenantId;      // ID dell'azienda/tenant

    @NotNull
    private Long departmentId;  // ID del dipartimento

    @NotNull
    private LocalDate workDate; // Data della presenza

    @NotNull
    private WorkMode status;    // OFFICE, REMOTE, etc.

    private String note;        // Note opzionali (es. "Al mattino fuori sede")
}