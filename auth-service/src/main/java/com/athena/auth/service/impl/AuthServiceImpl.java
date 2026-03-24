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
    public com.athena.common.dto.AuthResponse authenticate(LoginRequest loginRequest) {
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
                .toEntity(com.athena.common.dto.AuthResponse.class)
                .getBody();
    }

    @Override
    public com.athena.common.dto.AuthResponse register(SignupRequest signupRequest) {
        // Validazione manuale: deve esserci o il nome azienda (nuovo tenant) o un token invito
        if ((signupRequest.getCompanyName() == null || signupRequest.getCompanyName().isBlank()) &&
            (signupRequest.getInviteToken() == null || signupRequest.getInviteToken().isBlank())) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, 
                "Nome azienda obbligatorio per la creazione di un nuovo account (a meno che non si usi un invito)"
            );
        }

        java.util.Map<String, Object> metadata = new java.util.HashMap<>();
        metadata.put("full_name", signupRequest.getFullName());
        
        if (signupRequest.getCompanyName() != null) {
            metadata.put("company_name", signupRequest.getCompanyName());
        }
        // NOTE: invite_token is NOT stored in Supabase metadata (credential leak risk).
        // It is passed separately via /api/v1/profiles/setup and consumed there.

        Map<String, Object> body = Map.of(
                "email", signupRequest.getEmail(),
                "password", signupRequest.getPassword(),
                "data", metadata
        );

        return restClient.post()
                .uri(supabaseUrl + "/auth/v1/signup")
                .header("apikey", anonKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toEntity(com.athena.common.dto.AuthResponse.class)
                .getBody();
    }
}