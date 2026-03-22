package com.athena.attendance.config.interceptor;

import com.athena.attendance.entity.Profile;
import com.athena.attendance.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Interceptor for WebSocket messages that validates JWT tokens in the STOMP CONNECT frame
 * and enforces subscription authorization for team-specific topics.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;
    private final ProfileRepository profileRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && accessor.getCommand() != null) {
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                handleConnect(accessor);
            } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                handleSubscribe(accessor);
            }
        }

        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("WebSocket CONNECT attempt missing Authorization header");
            throw new org.springframework.messaging.MessagingException("Authentication failed: Missing token");
        }

        String token = authHeader.substring(7);
        try {
            Jwt jwt = jwtDecoder.decode(token);
            Authentication auth = new JwtAuthenticationToken(jwt);
            accessor.setUser(auth);
            log.debug("WebSocket CONNECT authenticated for user: {}", jwt.getSubject());
        } catch (Exception e) {
            log.error("WebSocket JWT validation failed: {}", e.getMessage());
            throw new org.springframework.messaging.MessagingException("Authentication failed: Invalid token");
        }
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        Authentication auth = (Authentication) accessor.getUser();
        if (auth == null || !auth.isAuthenticated()) {
            throw new org.springframework.messaging.MessagingException("Unauthorized: Connection must be authenticated before subscribing");
        }

        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith("/topic/team/")) {
            return;
        }

        // Destination format: /topic/team/{tenantId}/{deptId}
        String[] parts = destination.split("/");
        if (parts.length < 5) {
            log.error("Invalid topic format in subscription: {}", destination);
            throw new org.springframework.messaging.MessagingException("Invalid topic format");
        }

        try {
            Long tenantId = Long.parseLong(parts[3]);
            Long deptId = Long.parseLong(parts[4]);

            Jwt jwt = (Jwt) auth.getPrincipal();
            UUID userId = UUID.fromString(jwt.getSubject());

            validateSubscription(userId, tenantId, deptId, destination);
        } catch (NumberFormatException e) {
            log.error("Invalid numeric values in topic: {}", destination);
            throw new org.springframework.messaging.MessagingException("Invalid topic format");
        }
    }

    private void validateSubscription(UUID userId, Long tenantId, Long deptId, String destination) {
        Profile profile = profileRepository.findById(userId).orElse(null);
        if (profile == null || 
            profile.getTenantId() == null || !profile.getTenantId().equals(tenantId) || 
            profile.getDepartmentId() == null || !profile.getDepartmentId().equals(deptId)) {
            
            log.warn("SECURITY ALERT: User {} attempted to subscribe to unauthorized topic: {}", userId, destination);
            throw new org.springframework.messaging.MessagingException("Access Denied: You can only subscribe to your own team's presence updates");
        }
    }
}
