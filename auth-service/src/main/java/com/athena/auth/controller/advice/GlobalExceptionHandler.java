package com.athena.auth.controller.advice;

import com.athena.common.dto.ResponseDTO;
import com.athena.common.enums.ResponseStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(HttpClientErrorException.class)
    public ResponseEntity<ResponseDTO<Void>> handleHttpClientErrorException(HttpClientErrorException exc) {
        log.warn("Errore durante la chiamata a Supabase: {} - {}", exc.getStatusCode(), exc.getResponseBodyAsString());
        
        // Se Supabase restituisce 400 (Bad Request) o 401 (Unauthorized) per credenziali errate
        if (exc.getStatusCode().value() == 400 || exc.getStatusCode().value() == 401) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ResponseDTO.<Void>builder()
                            .status(ResponseStatus.UNAUTHORIZED)
                            .message("Email o password errati")
                            .build());
        }
        
        return ResponseEntity
                .status(exc.getStatusCode())
                .body(ResponseDTO.<Void>builder()
                        .status(ResponseStatus.ERROR)
                        .message("Errore durante l'operazione richiesta. Riprovare.")
                        .build());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ResponseDTO<Void>> handleResponseStatusException(ResponseStatusException exc) {
        String reason = exc.getReason() != null ? exc.getReason() : "Errore nella richiesta";
        return ResponseEntity
                .status(exc.getStatusCode())
                .body(ResponseDTO.<Void>builder()
                        .status(ResponseStatus.ERROR)
                        .message(reason)
                        .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseDTO<Void>> handleGenericException(Exception exc) {
        log.error("Eccezione non gestita catturata nell'auth-service: ", exc);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResponseDTO.<Void>builder()
                        .status(ResponseStatus.ERROR)
                        .message("Si è verificato un errore interno al server di autenticazione.")
                        .build());
    }
}
