package com.jithnuka.customer_management.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CustomerMobileDto {

    private Long id;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^\\+?[a-zA-Z0-9]{5,14}$", message = "Mobile number must be between 5 and 14 characters")
    private String mobileNumber;
}
