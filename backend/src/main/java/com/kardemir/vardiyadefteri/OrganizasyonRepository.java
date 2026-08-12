package com.kardemir.vardiyadefteri;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizasyonRepository extends JpaRepository<Organizasyon, Long> {
}