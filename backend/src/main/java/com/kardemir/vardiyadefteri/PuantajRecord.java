package com.kardemir.vardiyadefteri;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PuantajRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sicilNo;
    private String adSoyad;
    private LocalDate tarih;
    private String planlananVardiya;

    private LocalTime girisSaati;
    private LocalTime cikisSaati;

    private String otomatikDurum;
    private String mazeretTuru;      // Örn: DOKTOR_SEVK, SAHSI_IZIN vb.
    private String mazeretAciklamasi; // Örn: Poliklinik muayene kağıdı mevcut

    @ManyToOne
    @JoinColumn(name = "bolum_id")
    private Organizasyon bolum;
}