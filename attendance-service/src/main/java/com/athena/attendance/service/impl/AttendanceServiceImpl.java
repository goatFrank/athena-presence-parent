package com.athena.attendance.service.impl;

import com.athena.attendance.entity.Attendance;
import com.athena.attendance.repository.AttendanceRepository;
import com.athena.attendance.repository.ProfileRepository;
import com.athena.attendance.service.AttendanceService;
import com.athena.common.dto.AttendanceDTO;
import com.athena.common.dto.DashboardStatsDTO;
import com.athena.common.dto.ResponseDTO;
import com.athena.common.enums.ResponseStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

        private final AttendanceRepository repository;
        private final ProfileRepository profileRepository;
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
                List<Attendance> list = repository.findByTenantIdAndDepartmentIdAndWorkDate(tenantId, departmentId,
                                date);
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
        public ResponseDTO<List<Attendance>> getAttendanceForDateRange(UUID userId, LocalDate startDate,
                        LocalDate endDate) {
                List<Attendance> list = repository.findByUserIdAndWorkDateBetweenOrderByWorkDateAsc(userId, startDate,
                                endDate);
                return ResponseDTO.<List<Attendance>>builder()
                                .message("User attendance for date range retrieved successfully")
                                .payload(list)
                                .status(ResponseStatus.SUCCESS)
                                .build();
        }

        @Override
        public ResponseDTO<DashboardStatsDTO> getDashboardStats(UUID userId) {
                LocalDate today = LocalDate.now();
                LocalDate firstDayOfMonth = today.withDayOfMonth(1);
                LocalDate lastDayOfMonth = today.with(TemporalAdjusters.lastDayOfMonth());

                int totalWorkingDays = 0;
                for (LocalDate date = firstDayOfMonth; !date.isAfter(lastDayOfMonth); date = date.plusDays(1)) {
                        if (date.getDayOfWeek() != DayOfWeek.SATURDAY && date.getDayOfWeek() != DayOfWeek.SUNDAY) {
                                totalWorkingDays++;
                        }
                }

                List<Attendance> monthlyAttendances = repository.findByUserIdAndWorkDateBetweenOrderByWorkDateAsc(
                                userId, firstDayOfMonth, lastDayOfMonth);
                int officeDays = 0;
                int remoteDays = 0;

                for (Attendance att : monthlyAttendances) {
                        if (att.getStatus() != null) {
                                String status = att.getStatus().name().toLowerCase();
                                if (status.contains("office") || status.contains("sede")
                                                || status.equals("in_office")) {
                                        officeDays++;
                                } else {
                                        remoteDays++;
                                }
                        }
                }

                int teamPresencePercentage = 0;
                com.athena.attendance.entity.Profile profile = profileRepository.findById(userId).orElse(null);

                if (profile != null && profile.getTenantId() != null && profile.getDepartmentId() != null) {
                        int totalTeamMembers = profileRepository.countByTenantIdAndDepartmentId(profile.getTenantId(),
                                        profile.getDepartmentId());
                        if (totalTeamMembers > 0) {
                                List<Attendance> todayAttendances = repository.findByTenantIdAndDepartmentIdAndWorkDate(
                                                profile.getTenantId(), profile.getDepartmentId(), today);
                                int officeTeammates = 0;
                                for (Attendance att : todayAttendances) {
                                        if (att.getStatus() != null) {
                                                String status = att.getStatus().name().toLowerCase();
                                                if (status.contains("office") || status.contains("sede")
                                                                || status.equals("in_office")) {
                                                        officeTeammates++;
                                                }
                                        }
                                }
                                teamPresencePercentage = (int) Math
                                                .round(((double) officeTeammates / totalTeamMembers) * 100);
                        }
                }

                DashboardStatsDTO stats = DashboardStatsDTO.builder()
                                .officeDays(officeDays)
                                .remoteDays(remoteDays)
                                .totalWorkingDays(totalWorkingDays)
                                .teamPresencePercentage(teamPresencePercentage)
                                .build();

                return ResponseDTO.<DashboardStatsDTO>builder()
                                .message("Dashboard statistics retrieved successfully")
                                .payload(stats)
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
                // Il team iscritto al canale /topic/team/{tenantId}/{deptId} riceverà il nuovo
                // stato
                String destination = String.format("/topic/team/%d/%d", updated.getTenantId(),
                                updated.getDepartmentId());
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
                                                org.springframework.http.HttpStatus.NOT_FOUND,
                                                "Attendance not found with id: " + id));

                if (!attendance.getUserId().equals(userId)) {
                        throw new org.springframework.web.server.ResponseStatusException(
                                        org.springframework.http.HttpStatus.FORBIDDEN,
                                        "Unauthorized: You can only delete your own attendance records.");
                }

                repository.delete(attendance);
        }
}