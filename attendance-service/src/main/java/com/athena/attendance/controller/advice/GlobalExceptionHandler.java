package com.athena.attendance.controller.advice;

import com.athena.common.dto.ResponseDTO;
import com.athena.common.enums.ResponseStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ResponseDTO<Void>> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ResponseDTO.<Void>builder()
                        .status(ResponseStatus.ERROR)
                        .message("Il file supera il limite massimo consentito dal server (4MB)")
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

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ResponseDTO<Void>> handleAccessDeniedException(org.springframework.security.access.AccessDeniedException exc) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ResponseDTO.<Void>builder()
                        .status(ResponseStatus.FORBIDDEN)
                        .message("Accesso negato: non hai i permessi per eseguire questa operazione.")
                        .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseDTO<Void>> handleGenericException(Exception exc) {
        // Log the full exception for server-side debugging
        log.error("Eccezione non gestita catturata: ", exc);

        // Return a generic and safe message to the client
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResponseDTO.<Void>builder()
                        .status(ResponseStatus.ERROR)
                        .message("Si è verificato un errore interno al server. Se il problema persiste, contatta il supporto.")
                        .build());
    }
}
