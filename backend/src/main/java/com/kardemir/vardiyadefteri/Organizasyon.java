package com.kardemir.vardiyadefteri;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Organizasyon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String direktorlikAd;
    private String mudurlukAd;
    private String basmuhendislikAd;
    private String bolumAd;
}