package com.athena.attendance.service.impl;

import com.athena.attendance.entity.Attendance;
import com.athena.attendance.repository.AttendanceRepository;
import com.athena.attendance.service.AttendanceService;
import com.athena.common.dto.AttendanceDTO;
import com.athena.common.dto.ResponseDTO;
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
    public ResponseDTO<Attendance> saveAttendance(AttendanceDTO dto) {

        // Cerchiamo se esiste già un record per l'utente in quel giorno (Update)
        // altrimenti ne istanziamo uno nuovo (Create)
        Attendance attendance = repository.findByUserIdAndWorkDate(dto.getUserId(), dto.getWorkDate())
                .orElse(new Attendance());

        attendance.setUserId(dto.getUserId());
        attendance.setTenantId(dto.getTenantId());
        attendance.setDepartmentId(dto.getDepartmentId());
        attendance.setWorkDate(dto.getWorkDate());
        attendance.setStatus(dto.getStatus());
        attendance.setNote(dto.getNote());

        Attendance saved = repository.save(attendance);
        return ResponseDTO.<Attendance>builder()
                .response("Attendance saved successfully")
                .responseObj(saved)
                .build();
    }

    @Override
    public ResponseDTO<List<Attendance>> getTeamPresence(Long tenantId, Long departmentId, LocalDate date) {
        List<Attendance> list = repository.findByTenantIdAndDepartmentIdAndWorkDate(tenantId, departmentId, date);
        return ResponseDTO.<List<Attendance>>builder()
                .response("Team presence retrieved successfully")
                .responseObj(list)
                .build();
    }

    @Override
    public ResponseDTO<List<Attendance>> getTenantPresence(Long tenantId, LocalDate date) {
        List<Attendance> list = repository.findByTenantIdAndWorkDate(tenantId, date);
        return ResponseDTO.<List<Attendance>>builder()
                .response("Tenant presence retrieved successfully")
                .responseObj(list)
                .build();
    }

    @Override
    public ResponseDTO<List<Attendance>> getUserHistory(UUID userId) {
        List<Attendance> list = repository.findByUserIdOrderByWorkDateDesc(userId);
        return ResponseDTO.<List<Attendance>>builder()
                .response("User history retrieved successfully")
                .responseObj(list)
                .build();
    }
}