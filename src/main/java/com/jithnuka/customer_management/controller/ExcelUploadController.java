package com.jithnuka.customer_management.controller;

import com.jithnuka.customer_management.service.ExcelUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class ExcelUploadController {

    private final ExcelUploadService excelUploadService;

    @PostMapping("/customers")
    public ResponseEntity<?> uploadCustomers(@RequestParam("file") MultipartFile file) {
        try {
            String message = excelUploadService.processFile(file);
            return ResponseEntity.ok(java.util.Collections.singletonMap("message", message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }
}
