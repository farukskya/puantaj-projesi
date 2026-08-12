package com.kardemir.vardiyadefteri;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Personel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String sicilNo;

    private String adSoyad;
    private String unvan;

    @ManyToOne
    @JoinColumn(name = "bolum_id")
    private Organizasyon bolum;
}