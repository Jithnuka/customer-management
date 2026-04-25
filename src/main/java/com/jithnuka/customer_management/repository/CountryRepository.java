package com.jithnuka.customer_management.repository;

import com.jithnuka.customer_management.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CountryRepository extends JpaRepository<Country, Long> {
    Optional<Country> findByNameIgnoreCase(String name);
    Optional<Country> findByCodeIgnoreCase(String code);
}
