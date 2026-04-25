package com.jithnuka.customer_management.dto;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CustomerDto {
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Date of Birth is required")
    private LocalDate dob;

    @NotBlank(message = "NIC is required")
    @javax.validation.constraints.Size(max = 12, message = "NIC must not exceed 12 characters")
    private String nic;

    @Valid
    private List<CustomerMobileDto> mobileNumbers;

    @Valid
    private List<AddressDto> addresses;
    
    private List<CustomerDto> familyMembers;
}
