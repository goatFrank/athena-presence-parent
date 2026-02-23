package com.athena.auth.service.impl;

import com.athena.auth.service.AuthService;
import com.athena.common.dto.LoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon-key}")
    private String anonKey;

    private final RestClient restClient = RestClient.create();

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
}