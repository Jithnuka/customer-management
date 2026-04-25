package com.jithnuka.customer_management.repository;

import com.jithnuka.customer_management.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CityRepository extends JpaRepository<City, Long> {
    Optional<City> findByNameIgnoreCase(String name);
    Optional<City> findByNameIgnoreCaseAndCountryId(String name, Long countryId);
}
