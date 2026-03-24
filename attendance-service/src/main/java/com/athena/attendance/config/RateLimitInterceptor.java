package com.athena.attendance.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    @org.springframework.beans.factory.annotation.Value("${app.rate-limit.trusted-proxies:127.0.0.1,0:0:0:0:0:0:0:1}")
    private java.util.List<String> trustedProxies;

    private final ProxyManager<byte[]> proxyManager;

    private Supplier<BucketConfiguration> getBucketConfiguration() {
        return () -> {
            // 10 requests per minute
            Bandwidth limit = Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(1)));
            return BucketConfiguration.builder()
                    .addLimit(limit)
                    .build();
        };
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIp = getClientIp(request);
        byte[] key = clientIp.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        Bucket bucket = proxyManager.builder().build(key, getBucketConfiguration());

        if (bucket.tryConsume(1)) {
            return true;
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"status\": \"ERROR\", \"message\": \"Too many requests. Please try again later.\"}");
            return false;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        String xfHeader = request.getHeader("X-Forwarded-For");

        String effectiveIp = remoteAddr;
        if (xfHeader != null && !xfHeader.isEmpty() && isTrustedProxy(remoteAddr)) {
            effectiveIp = xfHeader.split(",")[0].trim();
        }

        String principalName = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "anon";
        return effectiveIp + "-" + principalName;
    }

    private boolean isTrustedProxy(String ip) {
        return trustedProxies.stream().anyMatch(proxy -> proxy.equals(ip) || proxy.equals("*"));
    }
}
