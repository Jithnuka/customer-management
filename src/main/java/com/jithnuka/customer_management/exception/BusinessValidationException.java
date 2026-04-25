package com.jithnuka.customer_management.exception;

import lombok.Getter;
import java.util.Map;

@Getter
public class BusinessValidationException extends RuntimeException {
    private final Map<String, String> errors;

    public BusinessValidationException(Map<String, String> errors) {
        super("Validation failed");
        this.errors = errors;
    }
}
