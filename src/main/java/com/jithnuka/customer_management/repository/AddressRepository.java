package com.jithnuka.customer_management.repository;

import com.jithnuka.customer_management.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AddressRepository extends JpaRepository<Address, Long> {
}
