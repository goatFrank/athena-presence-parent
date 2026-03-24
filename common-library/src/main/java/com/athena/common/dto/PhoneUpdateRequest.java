package com.athena.common.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Request DTO for updating a user's phone number.
 * Validates format to prevent injection and abuse.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PhoneUpdateRequest {

    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    @Pattern(regexp = "^$|^\\+?[0-9\\s\\-().]{0,20}$", message = "Invalid phone number format")
    private String phone;
}
