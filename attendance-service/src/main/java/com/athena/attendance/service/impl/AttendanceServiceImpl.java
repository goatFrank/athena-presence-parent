package com.athena.attendance.service.impl;

import com.athena.attendance.entity.Attendance;
import com.athena.attendance.repository.AttendanceRepository;
import com.athena.attendance.service.AttendanceService;
import com.athena.common.dto.AttendanceDTO;
import com.athena.common.dto.ResponseDTO;
import com.athena.common.enums.ResponseStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository repository;
    private final SimpMessagingTemplate messagingTemplate;

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
                .message("Attendance saved successfully")
                .payload(saved)
                .status(ResponseStatus.SUCCESS)
                .build();
    }

    @Override
    public ResponseDTO<List<Attendance>> getTeamPresence(Long tenantId, Long departmentId, LocalDate date) {
        List<Attendance> list = repository.findByTenantIdAndDepartmentIdAndWorkDate(tenantId, departmentId, date);
        return ResponseDTO.<List<Attendance>>builder()
                .message("Team presence retrieved successfully")
                .payload(list)
                .status(ResponseStatus.SUCCESS)
                .build();
    }

    @Override
    public ResponseDTO<List<Attendance>> getTenantPresence(Long tenantId, LocalDate date) {
        List<Attendance> list = repository.findByTenantIdAndWorkDate(tenantId, date);
        return ResponseDTO.<List<Attendance>>builder()
                .message("Tenant presence retrieved successfully")
                .payload(list)
                .status(ResponseStatus.SUCCESS)
                .build();
    }

    @Override
    public ResponseDTO<List<Attendance>> getUserHistory(UUID userId) {
        List<Attendance> list = repository.findByUserIdOrderByWorkDateDesc(userId);
        return ResponseDTO.<List<Attendance>>builder()
                .message("User history retrieved successfully")
                .payload(list)
                .status(ResponseStatus.SUCCESS)
                .build();
    }

    @Override
    @Transactional
    public ResponseDTO<Attendance> updateAttendance(Long id, AttendanceDTO dto) {
        Attendance attendance = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found with id: " + id));

        // Update
        attendance.setUserId(dto.getUserId());
        attendance.setTenantId(dto.getTenantId());
        attendance.setDepartmentId(dto.getDepartmentId());
        attendance.setWorkDate(dto.getWorkDate());
        attendance.setStatus(dto.getStatus());
        attendance.setNote(dto.getNote());

        Attendance updated = repository.save(attendance);

        // Invio dell'aggiornamento in tempo reale via WebSocket
        // Il team iscritto al canale /topic/team/{tenantId}/{deptId} riceverà il nuovo stato
        String destination = String.format("/topic/team/%d/%d", updated.getTenantId(), updated.getDepartmentId());
        messagingTemplate.convertAndSend(destination, updated);

        return ResponseDTO.<Attendance>builder()
                .message("Attendance updated successfully")
                .payload(updated)
                .status(ResponseStatus.SUCCESS)
                .build();
    }

    @Override
    @Transactional
    public void deleteAttendance(Long id, UUID userId) {
        Attendance attendance = repository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Attendance not found with id: " + id));

        if (!attendance.getUserId().equals(userId)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Unauthorized: You can only delete your own attendance records.");
        }

        repository.delete(attendance);
    }
}