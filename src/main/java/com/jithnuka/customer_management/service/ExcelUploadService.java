package com.jithnuka.customer_management.service;

import com.jithnuka.customer_management.entity.*;
import com.jithnuka.customer_management.repository.*;
import javax.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ExcelUploadService {

    private final CustomerRepository customerRepository;
    private final CountryRepository countryRepository;
    private final CityRepository cityRepository;
    private final EntityManager entityManager;

    private static final int BATCH_SIZE = 1000;

    @Transactional
    public String processFile(MultipartFile file) {
        String fileName = file.getOriginalFilename();
        if (fileName != null && fileName.toLowerCase().endsWith(".csv")) {
            return processCsv(file);
        } else {
            return processExcel(file);
        }
    }

    private String processExcel(MultipartFile file) {
        int total = 0, created = 0, updated = 0;
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            List<Customer> batch = new ArrayList<>();

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // skip header
                total++;

                String name = getCellValueAsString(row.getCell(0));
                String nic = getCellValueAsString(row.getCell(1));
                String dobString = getCellValueAsString(row.getCell(2));
                String mobile = getCellValueAsString(row.getCell(3));
                String addr1 = getCellValueAsString(row.getCell(4));
                String addr2 = getCellValueAsString(row.getCell(5));
                String cityName = getCellValueAsString(row.getCell(6));
                String countryName = getCellValueAsString(row.getCell(7));

                if (name.isEmpty() || nic.isEmpty()) continue;

                Optional<Customer> existingOpt = customerRepository.findByNic(nic);
                if (existingOpt.isPresent()) updated++; else created++;
                
                Customer customer = handleCustomerEntity(existingOpt, name, nic, dobString, mobile, addr1, addr2, cityName, countryName);
                if (customer == null) continue;

                batch.add(customer);
                if (batch.size() >= BATCH_SIZE) {
                    saveBatch(batch);
                }
            }
            saveBatch(batch);
            return String.format("Successfully processed %d records. (New: %d, Updated: %d)", total, created, updated);
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    private String processCsv(MultipartFile file) {
        int total = 0, created = 0, updated = 0;
        try (java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(file.getInputStream()))) {
            String line;
            boolean firstLine = true;
            List<Customer> batch = new ArrayList<>();
            while ((line = br.readLine()) != null) {
                if (firstLine) { firstLine = false; continue; }
                String[] data = line.split(",");
                if (data.length < 2) continue;
                total++;

                String name = data[0].trim();
                String nic = data[1].trim();
                String dobString = data.length > 2 ? data[2].trim() : "";
                String mobile = data.length > 3 ? data[3].trim() : "";
                String addr1 = data.length > 4 ? data[4].trim() : "";
                String addr2 = data.length > 5 ? data[5].trim() : "";
                String cityName = data.length > 6 ? data[6].trim() : "";
                String countryName = data.length > 7 ? data[7].trim() : "";

                Optional<Customer> existingOpt = customerRepository.findByNic(nic);
                if (existingOpt.isPresent()) updated++; else created++;

                Customer customer = handleCustomerEntity(existingOpt, name, nic, dobString, mobile, addr1, addr2, cityName, countryName);
                if (customer == null) continue;

                batch.add(customer);
                if (batch.size() >= BATCH_SIZE) {
                    saveBatch(batch);
                }
            }
            saveBatch(batch);
            return String.format("Successfully processed %d records. (New: %d, Updated: %d)", total, created, updated);
        } catch (Exception e) {
            throw new RuntimeException("Failed to process CSV file: " + e.getMessage(), e);
        }
    }

    private Customer handleCustomerEntity(Optional<Customer> existingOpt, String name, String nic, String dobString, String mobile, String addr1, String addr2, String cityName, String countryName) {
        LocalDate dob;
        try {
            dob = LocalDate.parse(dobString);
        } catch (Exception e) {
            return null; // Skip invalid dates
        }

        Customer customer;
        if (existingOpt.isPresent()) {
            customer = existingOpt.get();
            customer.setName(name);
            customer.setDob(dob);
        } else {
            customer = Customer.builder().name(name).nic(nic).dob(dob).build();
        }

        if (mobile != null && !mobile.isEmpty()) {
            final String finalMobile = mobile.startsWith("+") ? mobile : "+" + mobile;
            boolean exists = customer.getMobileNumbers().stream()
                    .anyMatch(m -> m.getMobileNumber().equals(finalMobile));
            if (!exists) {
                customer.addMobileNumber(com.jithnuka.customer_management.entity.CustomerMobile.builder()
                        .mobileNumber(finalMobile)
                        .build());
            }
        }

        if (cityName != null && !cityName.isEmpty() && countryName != null && !countryName.isEmpty()) {
            // Check if address already exists to avoid duplicates
            boolean addrExists = customer.getAddresses().stream()
                    .anyMatch(a -> a.getCity().getName().equalsIgnoreCase(cityName) && a.getAddressLine1().equalsIgnoreCase(addr1));
            
            if (!addrExists) {
                // Use the same logic as CustomerService to find/create city and country
                Country country = countryRepository.findByNameIgnoreCase(countryName)
                    .orElseGet(() -> countryRepository.saveAndFlush(Country.builder()
                        .name(countryName)
                        .code(countryName.substring(0, Math.min(3, countryName.length())).toUpperCase())
                        .phonePrefix("+")
                        .build()));

                City city = cityRepository.findByNameIgnoreCaseAndCountryId(cityName, country.getId())
                    .orElseGet(() -> cityRepository.saveAndFlush(City.builder()
                        .name(cityName)
                        .country(country)
                        .build()));

                customer.addAddress(com.jithnuka.customer_management.entity.Address.builder()
                        .addressLine1(addr1)
                        .addressLine2(addr2)
                        .city(city)
                        .country(country)
                        .build());
            }
        }

        return customer;
    }

    private void saveBatch(List<Customer> batch) {
        if (!batch.isEmpty()) {
            customerRepository.saveAll(batch);
            entityManager.flush();
            entityManager.clear();
            batch.clear();
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                return String.valueOf((long) cell.getNumericCellValue());
            default:
                return "";
        }
    }
}
