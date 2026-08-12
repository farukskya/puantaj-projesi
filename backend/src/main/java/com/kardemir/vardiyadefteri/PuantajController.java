package com.kardemir.vardiyadefteri;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/puantaj")
@CrossOrigin(origins = "*")
public class PuantajController {

    private final PuantajService service;

    public PuantajController(PuantajService service) {
        this.service = service;
    }

    @GetMapping("/personel/{bolumId}")
    public List<Personel> getBolumPersonelleri(@PathVariable Long bolumId) {
        return service.bolumPersonelleriniGetir(bolumId);
    }

    @PostMapping("/toplu-kaydet")
    public List<PuantajRecord> topluKaydet(@RequestBody List<PuantajRecord> kayitlar) {
        return service.topluKaydet(kayitlar);
    }
}