package com.kardemir.vardiyadefteri;

import org.springframework.stereotype.Service;
import java.time.Duration;
import java.time.LocalTime;
import java.util.List;

@Service
public class PuantajService {

    private final PuantajRepository puantajRepository;
    private final PersonelRepository personelRepository;

    public PuantajService(PuantajRepository puantajRepository, PersonelRepository personelRepository) {
        this.puantajRepository = puantajRepository;
        this.personelRepository = personelRepository;
    }

    public List<Personel> bolumPersonelleriniGetir(Long bolumId) {
        return personelRepository.findByBolumId(bolumId);
    }

    public List<PuantajRecord> topluKaydet(List<PuantajRecord> kayitlar) {
        for (PuantajRecord record : kayitlar) {
            hesaplaDurumVeMazeret(record);
        }
        return puantajRepository.saveAll(kayitlar);
    }

    private void hesaplaDurumVeMazeret(PuantajRecord record) {
        if (record.getGirisSaati() == null && record.getCikisSaati() == null) {
            record.setOtomatikDurum("GELMEDİ (DEVAMSIZ)");
        } else if (record.getGirisSaati() != null && record.getCikisSaati() != null) {
            LocalTime vardiyaBitis = LocalTime.of(16, 0); // Örnek 08:00-16:00 vardiyası
            LocalTime cikis = record.getCikisSaati();

            if (cikis.isBefore(vardiyaBitis)) {
                long erkenDakika = Duration.between(cikis, vardiyaBitis).toMinutes();
                record.setOtomatikDurum("ERKEN ÇIKTI (" + erkenDakika + " dk)");
            } else if (cikis.isAfter(vardiyaBitis.plusMinutes(15))) {
                long fazlaDakika = Duration.between(vardiyaBitis, cikis).toMinutes();
                record.setOtomatikDurum("FAZLA MESAİ (" + fazlaDakika + " dk)");
            } else {
                record.setOtomatikDurum("NORMAL (ZAMANINDA)");
                record.setMazeretTuru(null); // Normal çıkışta mazeret sıfırlanır
            }
        } else {
            record.setOtomatikDurum("EKSİK KART BASIMI");
        }
    }
}