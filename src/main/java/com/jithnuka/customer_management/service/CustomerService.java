package com.jithnuka.customer_management.service;

import com.jithnuka.customer_management.dto.AddressDto;
import com.jithnuka.customer_management.dto.CustomerDto;
import com.jithnuka.customer_management.entity.*;
import com.jithnuka.customer_management.repository.CityRepository;
import com.jithnuka.customer_management.repository.CountryRepository;
import com.jithnuka.customer_management.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.jithnuka.customer_management.exception.BusinessValidationException;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CityRepository cityRepository;
    private final CountryRepository countryRepository;

    @Transactional
    public CustomerDto createCustomer(CustomerDto dto) {
        if (customerRepository.existsByNic(dto.getNic())) {
            Map<String, String> errors = new HashMap<>();
            errors.put("nic", "Customer with this NIC already exists");
            throw new BusinessValidationException(errors);
        }
        Customer customer = mapToEntity(dto);
        return mapToDto(customerRepository.save(customer));
    }

    @Transactional
    public CustomerDto updateCustomer(Long id, CustomerDto dto) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        // Check NIC uniqueness if changed
        if (!existing.getNic().equals(dto.getNic()) && customerRepository.existsByNic(dto.getNic())) {
            Map<String, String> errors = new HashMap<>();
            errors.put("nic", "Customer with this NIC already exists");
            throw new BusinessValidationException(errors);
        }

        existing.setName(dto.getName());
        existing.setDob(dto.getDob());
        existing.setNic(dto.getNic());

        // Update mobile numbers
        existing.getMobileNumbers().clear();
        if (dto.getMobileNumbers() != null) {
            for (com.jithnuka.customer_management.dto.CustomerMobileDto mobileDto : dto.getMobileNumbers()) {
                existing.addMobileNumber(CustomerMobile.builder()
                        .mobileNumber(mobileDto.getMobileNumber())
                        .build());
            }
        }

        // Update addresses
        existing.getAddresses().clear();
        if (dto.getAddresses() != null) {
            for (AddressDto addressDto : dto.getAddresses()) {
                City city = getCity(addressDto.getCityName(), addressDto.getCountryName());
                Country country = city.getCountry();
                Address address = Address.builder()
                        .addressLine1(addressDto.getAddressLine1())
                        .addressLine2(addressDto.getAddressLine2())
                        .city(city)
                        .country(country)
                        .build();
                existing.addAddress(address);
            }
        }
        
        // Update Family Members (simplified by finding by NIC from DTO)
        if (dto.getFamilyMembers() != null) {
            List<Customer> familyMembers = new ArrayList<>();
            for (CustomerDto fmDto : dto.getFamilyMembers()) {
                customerRepository.findByNic(fmDto.getNic()).ifPresent(familyMembers::add);
            }
            existing.setFamilyMembers(familyMembers);
        }

        return mapToDto(customerRepository.save(existing));
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        return mapToDto(customer);
    }

    @Transactional(readOnly = true)
    public Page<CustomerDto> getAllCustomers(Pageable pageable) {
        return customerRepository.findAll(pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public List<CustomerDto> searchCustomers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return customerRepository.findByNameContainingIgnoreCaseOrNicContainingIgnoreCase(query, query)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private City getCity(String cityName, String countryName) {
        // Find country first
        Country country = countryRepository.findByNameIgnoreCase(countryName).orElseGet(() -> {
            String code = countryName.length() >= 3 ? countryName.substring(0, 3).toUpperCase() : countryName.toUpperCase();
            // If code exists, add a random digit to make it unique
            String finalCode = code;
            int count = 1;
            while (countryRepository.findByCodeIgnoreCase(finalCode).isPresent()) {
                finalCode = code + (count++);
            }
            Country newCountry = Country.builder()
                    .name(countryName)
                    .code(finalCode)
                    .phonePrefix("+" + finalCode)
                    .build();
            return countryRepository.save(newCountry);
        });

        // Find city within that country using the new robust method
        return cityRepository.findByNameIgnoreCaseAndCountryId(cityName, country.getId())
                .orElseGet(() -> cityRepository.save(City.builder().name(cityName).country(country).build()));
    }

    private Customer mapToEntity(CustomerDto dto) {
        Customer customer = Customer.builder()
                .name(dto.getName())
                .dob(dto.getDob())
                .nic(dto.getNic())
                .build();

        if (dto.getMobileNumbers() != null) {
            dto.getMobileNumbers().forEach(mobileDto ->
                    customer.addMobileNumber(CustomerMobile.builder()
                            .mobileNumber(mobileDto.getMobileNumber())
                            .build())
            );
        }

        if (dto.getAddresses() != null) {
            dto.getAddresses().forEach(addressDto -> {
                City city = getCity(addressDto.getCityName(), addressDto.getCountryName());
                Address address = Address.builder()
                        .addressLine1(addressDto.getAddressLine1())
                        .addressLine2(addressDto.getAddressLine2())
                        .city(city)
                        .country(city.getCountry())
                        .build();
                customer.addAddress(address);
            });
        }
        
        if (dto.getFamilyMembers() != null) {
             List<Customer> familyMembers = new ArrayList<>();
             for (CustomerDto fmDto : dto.getFamilyMembers()) {
                 customerRepository.findByNic(fmDto.getNic()).ifPresent(familyMembers::add);
             }
             customer.setFamilyMembers(familyMembers);
        }

        return customer;
    }

    private CustomerDto mapToDto(Customer customer) {
        return CustomerDto.builder()
                .id(customer.getId())
                .name(customer.getName())
                .dob(customer.getDob())
                .nic(customer.getNic())
                .mobileNumbers(customer.getMobileNumbers().stream().map(m -> 
                        com.jithnuka.customer_management.dto.CustomerMobileDto.builder()
                        .id(m.getId())
                        .mobileNumber(m.getMobileNumber())
                        .build()).collect(Collectors.toList()))
                .addresses(customer.getAddresses().stream().map(a -> AddressDto.builder()
                        .id(a.getId())
                        .addressLine1(a.getAddressLine1())
                        .addressLine2(a.getAddressLine2())
                        .cityName(a.getCity() != null ? a.getCity().getName() : "N/A")
                        .countryName(a.getCountry() != null ? a.getCountry().getName() : "N/A")
                        .build()).collect(Collectors.toList()))
                .familyMembers(customer.getFamilyMembers().stream().map(fm -> CustomerDto.builder()
                        .id(fm.getId())
                        .name(fm.getName())
                        .nic(fm.getNic())
                        .build()).collect(Collectors.toList()))
                .build();
    }
}
