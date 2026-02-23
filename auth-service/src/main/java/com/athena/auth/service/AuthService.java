package com.athena.auth.service;

import com.athena.common.dto.LoginRequest;
import com.athena.common.dto.SignupRequest;

public interface AuthService {
    /**
     * restituisce il token JWT.
     */
    Object authenticate(LoginRequest loginRequest);

    /**
     * registrazione di un nuovo utente con supabase
     */
    Object register(SignupRequest signupRequest);
}