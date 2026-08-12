package com.kardemir.vardiyadefteri;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PersonelRepository extends JpaRepository<Personel, Long> {
    // Bölüm ID'sine göre çalışanları listeleme sorgusu
    List<Personel> findByBolumId(Long bolumId);
}