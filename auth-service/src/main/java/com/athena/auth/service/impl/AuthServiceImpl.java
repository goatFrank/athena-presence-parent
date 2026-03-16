package com.athena.auth.service.impl;

import com.athena.auth.service.AuthService;
import com.athena.common.dto.LoginRequest;
import com.athena.common.dto.SignupRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class AuthServiceImpl implements AuthService {

    private final String supabaseUrl;
    private final String anonKey;
    private final RestClient restClient;

    public AuthServiceImpl(
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.anon-key}") String anonKey) {
        this.supabaseUrl = supabaseUrl;
        this.anonKey = anonKey;
        this.restClient = RestClient.create();
    }

    @Override
    public Object authenticate(LoginRequest loginRequest) {
        Map<String, String> body = Map.of(
                "email", loginRequest.getEmail(),
                "password", loginRequest.getPassword()
        );

        return restClient.post()
                .uri(supabaseUrl + "/auth/v1/token?grant_type=password")
                .header("apikey", anonKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toEntity(Object.class)
                .getBody();
    }

    @Override
    public Object register(SignupRequest signupRequest) {
        Map<String, Object> body = Map.of(
                "email", signupRequest.getEmail(),
                "password", signupRequest.getPassword(),
                "data", Map.of(
                        "full_name", signupRequest.getFullName(),
                        "company_name", signupRequest.getCompanyName()
                )
        );

        return restClient.post()
                .uri(supabaseUrl + "/auth/v1/signup")
                .header("apikey", anonKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toEntity(Object.class)
                .getBody();
    }
}