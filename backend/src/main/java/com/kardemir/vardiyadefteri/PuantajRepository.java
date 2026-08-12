package com.kardemir.vardiyadefteri;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PuantajRepository extends JpaRepository<PuantajRecord, Long> {
}