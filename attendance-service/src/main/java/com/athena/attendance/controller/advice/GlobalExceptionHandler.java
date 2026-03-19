package com.athena.attendance.controller.advice;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(Map.of("message", "Il file supera il limite massimo consentito dal server (4MB)"));
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
        // Log the full exception for server-side debugging
        log.error("Eccezione non gestita catturata: ", exc);

        // Return a generic and safe message to the client
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Si è verificato un errore interno al server. Se il problema persiste, contatta il supporto."));
    }
}
