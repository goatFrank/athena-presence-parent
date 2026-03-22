package com.athena.auth.controller.advice;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(HttpClientErrorException.class)
    public ResponseEntity<Map<String, String>> handleHttpClientErrorException(HttpClientErrorException exc) {
        log.warn("Errore durante la chiamata a Supabase: {} - {}", exc.getStatusCode(), exc.getResponseBodyAsString());
        
        // Se Supabase restituisce 400 (Bad Request) o 401 (Unauthorized) per credenziali errate
        if (exc.getStatusCode().value() == 400 || exc.getStatusCode().value() == 401) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Email o password errati"));
        }
        
        return ResponseEntity
                .status(exc.getStatusCode())
                .body(Map.of("message", "Errore di autenticazione: " + exc.getStatusText()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusException(ResponseStatusException exc) {
        String reason = exc.getReason() != null ? exc.getReason() : "Errore nella richiesta";
        return ResponseEntity
                .status(exc.getStatusCode())
                .body(Map.of("message", reason));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception exc) {
        log.error("Eccezione non gestita catturata nell'auth-service: ", exc);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Si è verificato un errore interno al server di autenticazione."));
    }
}
