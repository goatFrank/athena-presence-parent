package com.athena.attendance.config.interceptor;

import com.athena.attendance.entity.Profile;
import com.athena.attendance.repository.ProfileRepository;
import com.athena.common.constants.RoleConstants;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReadOnlyInterceptor implements HandlerInterceptor {

    private final ProfileRepository profileRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String method = request.getMethod();

        // 1. Allow all GET requests
        if ("GET".equalsIgnoreCase(method)) {
            return true;
        }

        // 2. Get current authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return true; // Let Security handle unauthenticated requests
        }

        // 3. Get user ID from JWT
        UUID userId;
        try {
            userId = UUID.fromString(jwt.getSubject());
        } catch (Exception e) {
            return true;
        }

        // 4. Check user role in DB
        Profile profile = profileRepository.findById(userId).orElse(null);
        if (profile == null || profile.getRole() == null) {
            return true; 
        }

        Long roleId = profile.getRole().getId();

        // 5. If Demo role, block non-GET methods
        if (roleId.equals(RoleConstants.MANAGER_DEMO) || roleId.equals(RoleConstants.EMPLOYEE_DEMO)) {
            log.warn("Blocked {} request to {} from Demo User: {}", method, request.getRequestURI(), userId);
            response.sendError(HttpStatus.FORBIDDEN.value(), "Questo è un account demo, le operazioni di scrittura sono disabilitate");
            return false;
        }

        return true;
    }
}
