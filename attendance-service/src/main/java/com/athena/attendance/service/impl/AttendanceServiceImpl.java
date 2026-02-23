package com.athena.attendance.service.impl;

import com.athena.attendance.entity.Attendance;
import com.athena.attendance.repository.AttendanceRepository;
import com.athena.attendance.service.AttendanceService;
import com.athena.common.dto.AttendanceDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository repository;

    @Override
    @Transactional
    public Attendance saveAttendance(AttendanceDTO dto) {

        // Cerchiamo se esiste già un record per l'utente in quel giorno (Update)
        // altrimenti ne istanziamo uno nuovo (Create)
        Attendance attendance = repository.findByUserIdAndWorkDate(dto.getUserId(), dto.getWorkDate())
                .orElse(new Attendance());

        attendance.setUserId(dto.getUserId());
        attendance.setTenantId(dto.getTenantId());
        attendance.setWorkDate(dto.getWorkDate());
        attendance.setStatus(dto.getStatus());
        attendance.setNote(dto.getNote());

        return repository.save(attendance);
    }

    @Override
    public List<Attendance> getTeamPresence(UUID tenantId, LocalDate date) {
        return repository.findByTenantIdAndWorkDate(tenantId, date);
    }

    @Override
    public List<Attendance> getUserHistory(UUID userId) {
        return repository.findByUserIdOrderByWorkDateDesc(userId);
    }
}