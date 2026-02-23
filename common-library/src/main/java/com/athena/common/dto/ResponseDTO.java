package com.athena.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.athena.common.enums.ResponseStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResponseDTO<T> {

    private ResponseStatus status;
    private String message;
    private T payload;
}

