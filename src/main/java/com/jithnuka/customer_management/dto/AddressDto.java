package com.jithnuka.customer_management.dto;

import javax.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AddressDto {
    private Long id;

    @NotBlank(message = "Address line 1 is required")
    private String addressLine1;
    
    private String addressLine2;

    @NotBlank(message = "City name is required")
    private String cityName;

    @NotBlank(message = "Country name is required")
    private String countryName;
}
