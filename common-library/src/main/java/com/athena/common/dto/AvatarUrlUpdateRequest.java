package com.athena.common.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarUrlUpdateRequest {
    @NotBlank(message = "L'URL dell'avatar non può essere vuoto")
    @URL(message = "L'URL dell'avatar deve essere un URL valido")
    private String avatarUrl;
}
