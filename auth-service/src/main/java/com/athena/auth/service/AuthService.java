package com.athena.auth.service;

import com.athena.common.dto.LoginRequest;

public interface AuthService {
    /**
     * restituisce il token JWT.
     */
    Object authenticate(LoginRequest loginRequest);
}