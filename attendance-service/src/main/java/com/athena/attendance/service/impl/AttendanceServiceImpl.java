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
        public ResponseDTO<Attendance> saveAttendance(AttendanceDTO dto, UUID authenticatedUserId) {

                // Cannot modify past days
                if (dto.getWorkDate().isBefore(LocalDate.now())) {
                        return ResponseDTO.<Attendance>builder()
                                        .message("Cannot modify attendance for past dates")
                                        .payload(null)
                                        .status(ResponseStatus.BAD_REQUEST)
                                        .build();
                }

                // Security Enforcement: fetch true Profile linked to auth UUID
                com.athena.attendance.entity.Profile profile = profileRepository.findById(authenticatedUserId)
                                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                                                org.springframework.http.HttpStatus.NOT_FOUND,
                                                "UserProfile not found for authenticated user"));

                // Verify the user has a role assigned before allowing them to insert attendance
                if (profile.getRole() == null) {
                        throw new org.springframework.web.server.ResponseStatusException(
                                        org.springframework.http.HttpStatus.FORBIDDEN,
                                        "Il tuo profilo non ha ancora un ruolo assegnato. Contatta l'amministratore.");
                }

                // Cerchiamo se esiste già un record per l'utente in quel giorno (Update)
                // altrimenti ne istanziamo uno nuovo (Create)
                Attendance attendance = repository.findByUserIdAndWorkDate(authenticatedUserId, dto.getWorkDate())
                                .orElse(new Attendance());

                // Forziamo i dati dal profilo vero invece di fidarci del DTO (che può essere
                // manomesso dal client)
                attendance.setUserId(authenticatedUserId);
                attendance.setTenantId(profile.getTenantId());
                attendance.setDepartmentId(profile.getDepartmentId());

                attendance.setWorkDate(dto.getWorkDate());
                attendance.setStatus(dto.getStatus());
                attendance.setNote(dto.getNote());

                Attendance saved = repository.save(attendance);

                // Invio dell'aggiornamento in tempo reale via WebSocket
                String destination = String.format("/topic/team/%d/%d", saved.getTenantId(), saved.getDepartmentId());
                messagingTemplate.convertAndSend(destination, saved);

                return ResponseDTO.<Attendance>builder()
                                .message("Attendance saved successfully")
                                .payload(saved)
                                .status(ResponseStatus.SUCCESS)
                                .build();
        }

        @Override
        public ResponseDTO<List<Attendance>> getTeamPresence(Long tenantId, Long departmentId, LocalDate date, UUID authenticatedUserId) {
                // Authorization Check
                com.athena.attendance.entity.Profile profile = profileRepository.findById(authenticatedUserId)
                                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                                                org.springframework.http.HttpStatus.NOT_FOUND,
                                                "UserProfile not found"));

                boolean isSuperAdmin = profile.getRole() != null && profile.getRole().getId().equals(1L);
                boolean isTenantAdmin = profile.getRole() != null && profile.getRole().getId().equals(2L);
                
                boolean sameTenant = profile.getTenantId() != null && profile.getTenantId().equals(tenantId);
                boolean sameDepartment = profile.getDepartmentId() != null && profile.getDepartmentId().equals(departmentId);

                if (!isSuperAdmin) {
                        if (!sameTenant) {
                                throw new org.springframework.web.server.ResponseStatusException(
                                                org.springframework.http.HttpStatus.FORBIDDEN,
                                                "Access Denied: You cannot access other tenant's data");
                        }
                        if (!isTenantAdmin && !sameDepartment) {
                                throw new org.springframework.web.server.ResponseStatusException(
                                                org.springframework.http.HttpStatus.FORBIDDEN,
                                                "Access Denied: You cannot access other department's data");
                        }
                }

                List<Attendance> list = repository.findByTenantIdAndDepartmentIdAndWorkDate(tenantId, departmentId,
                                date);
                return ResponseDTO.<List<Attendance>>builder()
                                .message("Team presence retrieved successfully")
                                .payload(list)
                                .status(ResponseStatus.SUCCESS)
                                .build();
        }

        @Override
        public ResponseDTO<List<Attendance>> getTenantPresence(Long tenantId, LocalDate date, UUID authenticatedUserId) {
                // Authorization Check
                com.athena.attendance.entity.Profile profile = profileRepository.findById(authenticatedUserId)
                                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                                                org.springframework.http.HttpStatus.NOT_FOUND,
                                                "UserProfile not found"));

                boolean isSuperAdmin = profile.getRole() != null && profile.getRole().getId().equals(1L);
                boolean isTenantAdmin = profile.getRole() != null && profile.getRole().getId().equals(2L);

                if (!isSuperAdmin) {
                        if (profile.getTenantId() == null || !profile.getTenantId().equals(tenantId)) {
                                throw new org.springframework.web.server.ResponseStatusException(
                                                org.springframework.http.HttpStatus.FORBIDDEN,
                                                "Access Denied: You cannot access other tenant's data");
                        }
                        if (!isTenantAdmin) {
                                throw new org.springframework.web.server.ResponseStatusException(
                                                org.springframework.http.HttpStatus.FORBIDDEN,
                                                "Access Denied: You must be a Tenant Admin to view full tenant data");
                        }
                }

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
                int sickDays = 0;
                int holidayDays = 0;

                for (Attendance att : monthlyAttendances) {
                        if (att.getStatus() != null) {
                                switch (att.getStatus()) {
                                        case OFFICE:
                                                officeDays++;
                                                break;
                                        case REMOTE:
                                                remoteDays++;
                                                break;
                                        case SICK:
                                                sickDays++;
                                                break;
                                        case HOLIDAY:
                                                holidayDays++;
                                                break;
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
                                .sickDays(sickDays)
                                .holidayDays(holidayDays)
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
        public ResponseDTO<Attendance> getMyTodayStatus(UUID userId) {
                LocalDate today = LocalDate.now();
                java.util.Optional<Attendance> attendance = repository.findByUserIdAndWorkDate(userId, today);

                if (attendance.isPresent()) {
                        return ResponseDTO.<Attendance>builder()
                                        .message("Today's attendance retrieved successfully")
                                        .payload(attendance.get())
                                        .status(ResponseStatus.SUCCESS)
                                        .build();
                } else {
                        return ResponseDTO.<Attendance>builder()
                                        .message("No attendance planned for today")
                                        .payload(null)
                                        .status(ResponseStatus.SUCCESS)
                                        .build();
                }
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

                // Cannot delete past days
                if (attendance.getWorkDate().isBefore(LocalDate.now())) {
                        throw new org.springframework.web.server.ResponseStatusException(
                                        org.springframework.http.HttpStatus.BAD_REQUEST,
                                        "Cannot delete attendance for past dates");
                }

                // Invio notifica di cancellazione via WebSocket
                String destination = String.format("/topic/team/%d/%d", attendance.getTenantId(), attendance.getDepartmentId());
                // Delete the attendance record
                repository.delete(attendance);

                // Invio notifica di cancellazione via WebSocket solo dopo il successo
                messagingTemplate.convertAndSend(destination, attendance);
        }

        @Override
        public ResponseDTO<List<com.athena.common.dto.TeamColleagueDTO>> getTeamOverview(UUID userId, String filter,
                        String search, LocalDate date) {
                // 1. Get the current user's profile to know tenant and department
                var meProfileOpt = profileRepository.findById(userId);
                if (meProfileOpt.isEmpty()) {
                        return ResponseDTO.<List<com.athena.common.dto.TeamColleagueDTO>>builder()
                                        .message("User profile not found")
                                        .status(ResponseStatus.NOT_FOUND)
                                        .build();
                }
                var me = meProfileOpt.get();

                // 2. Get all other profiles in the same tenant and department
                List<com.athena.attendance.entity.Profile> colleagues;
                boolean isSuperAdmin = me.getRole() != null && me.getRole().getId().equals(1L);

                if (me.getTenantId() != null && me.getDepartmentId() != null) {
                        colleagues = profileRepository.findByTenantIdAndDepartmentId(me.getTenantId(),
                                        me.getDepartmentId());
                } else if (me.getTenantId() != null) {
                        colleagues = profileRepository.findByTenantId(me.getTenantId());
                } else if (isSuperAdmin) {
                        colleagues = profileRepository.findAll();
                } else {
                        // User without tenant and not Superadmin should see nothing
                        return ResponseDTO.<List<com.athena.common.dto.TeamColleagueDTO>>builder()
                                        .message("Team overview retrieved successfully")
                                        .payload(java.util.Collections.emptyList())
                                        .status(ResponseStatus.SUCCESS)
                                        .build();
                }

                // Remove self
                colleagues.removeIf(p -> p.getId().equals(userId));

                // 3. Get target date's attendances for everyone in the department
                LocalDate targetDate = (date != null) ? date : LocalDate.now();
                List<Attendance> targetAttendances;
                if (me.getTenantId() != null && me.getDepartmentId() != null) {
                        targetAttendances = repository.findByTenantIdAndDepartmentIdAndWorkDate(me.getTenantId(),
                                        me.getDepartmentId(), targetDate);
                } else if (me.getTenantId() != null) {
                        targetAttendances = repository.findByTenantIdAndWorkDate(me.getTenantId(), targetDate);
                } else if (isSuperAdmin) {
                        targetAttendances = repository.findByWorkDate(targetDate);
                } else {
                        targetAttendances = java.util.Collections.emptyList();
                }

                String searchLower = search == null ? "" : search.toLowerCase();

                // 4. Map and filter
                List<com.athena.common.dto.TeamColleagueDTO> result = colleagues.stream().map(p -> {
                        Attendance att = targetAttendances.stream()
                                        .filter(a -> a.getUserId().equals(p.getId()))
                                        .findFirst()
                                        .orElse(null);

                        String rawStatus = att != null && att.getStatus() != null ? att.getStatus().name().toLowerCase()
                                        : "unmarked";
                        String workStatus = "unmarked";

                        if (rawStatus.contains("office") || rawStatus.contains("sede")
                                        || rawStatus.equals("in_office")) {
                                workStatus = "office";
                        } else if (rawStatus.contains("leave") || rawStatus.contains("ferie")
                                        || rawStatus.contains("malattia") || rawStatus.contains("sick")
                                        || rawStatus.contains("holiday")) {
                                workStatus = "leave";
                        } else if (rawStatus.contains("remote") || rawStatus.contains("smart")) {
                                workStatus = "remote";
                        }

                        String locationDetails = att != null && att.getNote() != null && !att.getNote().isBlank()
                                        ? att.getNote()
                                        : (workStatus.equals("leave") ? "Non disponibile" : (workStatus.equals("unmarked") ? "Non Inserita" : "Disponibile"));
                        
                        if (locationDetails.isBlank() || locationDetails.equals("Disponibile")
                                        || locationDetails.equals("Non disponibile") || locationDetails.equals("Non Inserita")) {
                                locationDetails = workStatus.equals("office") ? "In Sede"
                                                : (workStatus.equals("leave") ? "Ritarda" : (workStatus.equals("unmarked") ? "Non Inserita" : "Smart Working"));

                                if (workStatus.equals("leave")) {
                                        locationDetails = "Non disponibile";
                                }
                        }

                        return com.athena.common.dto.TeamColleagueDTO.builder()
                                        .id(p.getId())
                                        .fullName(p.getFullName() != null ? p.getFullName() : "Utente")
                                        .avatarUrl(p.getAvatarUrl() != null ? p.getAvatarUrl() : "")
                                        .roleDescription(p.getRoleDescription() != null ? p.getRoleDescription() : "")
                                        .workStatus(workStatus)
                                        .locationDetails(locationDetails)
                                        .build();
                }).filter(dto -> {
                        // Apply filter tab
                        boolean matchesFilter = filter == null || filter.isBlank() || filter.equals("all")
                                        || dto.getWorkStatus().equals(filter);

                        // Apply text search
                        boolean matchesSearch = searchLower.isBlank() ||
                                        dto.getFullName().toLowerCase().contains(searchLower) ||
                                        dto.getLocationDetails().toLowerCase().contains(searchLower);

                        return matchesFilter && matchesSearch;
                }).toList();

                return ResponseDTO.<List<com.athena.common.dto.TeamColleagueDTO>>builder()
                                .message("Team overview retrieved successfully")
                                .payload(result)
                                .status(ResponseStatus.SUCCESS)
                                .build();
        }
}