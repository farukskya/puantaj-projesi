import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  aktifSekme: string = 'gunluk';

  secilenTarih: string = '2026-08-07';
  genelPlanlananVardiya: string = '08:00-16:00';
  secilenAmir: string = '';

  secilenDirektorlik: string = '';
  secilenMudurluk: string = '';
  secilenBasmuhendislik: string = '';
  secilenBolum: string = '';

  secilenAylikPersonelSicil: string = '1001';
  secilenAylikPersonelAd: string = 'Personel A';
  secilenAylikTarih: string = '2026-08';
  secilenAyVeYilYazisi: string = 'Ağustos 2026';

  otuzGunlukPuantaj: any[] = [];

  amirler = [
    { sicilNo: '5001', adSoyad: 'Amir A' },
    { sicilNo: '5002', adSoyad: 'Amir B' }
  ];

  direktorlikler = [
    { id: 'DIR_1', ad: '1. Üretim Direktörlüğü' },
    { id: 'DIR_2', ad: '2. Teknik Direktörlük' }
  ];

  mudurlukler: any[] = [];
  basmuhendislikler: any[] = [];
  bolumler: any[] = [];
  personelListesi: any[] = [];

  constructor() {
    this.aylikTarihDegisti();
  }
  ozetOzet = {
    fiiliCalisilanGun: 0,
    haftaIzniGun: 0,
    resmiTatilGun: 0,
    toplamFazlaMesai: 0,
    raporVeIzinGun: 0
  };

  sekmeDegistir(sekme: string) {
    this.aktifSekme = sekme;
  }

  aylikPuantajSayfasinaGit(personel: any) {
    this.secilenAylikPersonelSicil = personel.sicilNo;
    this.secilenAylikPersonelAd = personel.adSoyad;
    this.aylikTarihDegisti();
    this.aktifSekme = 'aylik';
  }

  aylikPersonelDegisti() {
    if (this.secilenAylikPersonelSicil === '1001') this.secilenAylikPersonelAd = 'Personel A';
    if (this.secilenAylikPersonelSicil === '1002') this.secilenAylikPersonelAd = 'Personel B';
    if (this.secilenAylikPersonelSicil === '1003') this.secilenAylikPersonelAd = 'Personel C';
    this.aylikTarihDegisti();
  }

  aylikTarihDegisti() {
    if (this.secilenAylikTarih) {
      const parcalar = this.secilenAylikTarih.split('-');
      const yil = parseInt(parcalar[0], 10);
      const ay = parseInt(parcalar[1], 10);

      const ayIsimleri = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylul', 'Ekim', 'Kasım', 'Aralık'
      ];

      this.secilenAyVeYilYazisi = `${ayIsimleri[ay - 1]} ${yil}`;
      this.generate30GunlukPuantaj(yil, ay);
    }
  }

  generate30GunlukPuantaj(yil: number, ay: number) {
  const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  this.otuzGunlukPuantaj = [];

  // 1. HER AY DEĞİŞTİĞİNDE SAYAÇLARI SIFIRLIYORUZ
  this.ozetOzet = {
    fiiliCalisilanGun: 0,
    haftaIzniGun: 0,
    resmiTatilGun: 0,
    toplamFazlaMesai: 0,
    raporVeIzinGun: 0
  };

  const toplamGun = new Date(yil, ay, 0).getDate();

  for (let i = 1; i <= toplamGun; i++) {
    const tarihObj = new Date(yil, ay - 1, i);
    const gunAdi = gunler[tarihObj.getDay()];

    let durum = 'NORMAL ÇALIŞMA';
    let giris = '08:00';
    let cikis = '16:00';
    let calisilanSaat = 8;
    let fazlaMesai = 0;
    let aciklama = '';

    if (gunAdi === 'Pazar') {
      durum = 'HAFTA İZNİ';
      giris = '';
      cikis = '';
      calisilanSaat = 0;
      aciklama = 'Haftalık dinlenme günü';
    } else if (ay === 7 && i === 15) {
      durum = 'RESMİ TATİL';
      giris = '';
      cikis = '';
      calisilanSaat = 0;
      aciklama = '15 Temmuz Demokrasi Bayramı';
    } else if (ay === 8 && i === 30) {
      durum = 'RESMİ TATİL';
      giris = '';
      cikis = '';
      calisilanSaat = 0;
      aciklama = '30 Ağustos Zafer Bayramı';
    }

    // 2. DÖNGÜ İÇİNDE GÜNÜN DURUMUNA GÖRE SAYACI +1 ARTIRIYORUZ
    if (durum === 'NORMAL ÇALIŞMA' || durum.includes('MESAİ')) {
      this.ozetOzet.fiiliCalisilanGun++;
    } else if (durum === 'HAFTA İZNİ') {
      this.ozetOzet.haftaIzniGun++;
    } else if (durum === 'RESMİ TATİL') {
      this.ozetOzet.resmiTatilGun++;
    } else if (durum.includes('RAPOR') || durum.includes('İZNİ') || durum.includes('SEVK')) {
      this.ozetOzet.raporVeIzinGun++;
    }

    this.ozetOzet.toplamFazlaMesai += fazlaMesai;

    const ayFormatli = ay < 10 ? '0' + ay : ay;
    const gunFormatli = i < 10 ? '0' + i : i;

    this.otuzGunlukPuantaj.push({
      gunNo: i,
      tarih: `${gunFormatli}.${ayFormatli}.${yil}`,
      gunAdi: gunAdi,
      vardiya: calisilanSaat > 0 ? '08:00-16:00' : 'OFF',
      giris: giris,
      cikis: cikis,
      calisilanSaat: calisilanSaat,
      fazlaMesai: fazlaMesai,
      durum: durum,
      aciklama: aciklama
    });
  }
}
excelIndir() {
  console.log('Excel indirme metodu tetiklendi.'); // Test için konsol logu

  if (!this.otuzGunlukPuantaj || this.otuzGunlukPuantaj.length === 0) {
    alert('İndirilecek puantaj verisi bulunamadı!');
    return;
  }

  // Excel tablo kolonlarını ve veriyi hazırlıyoruz
  const excelVerisi = this.otuzGunlukPuantaj.map(g => ({
    'Gün No': g.gunNo,
    'Tarih': g.tarih,
    'Gün': g.gunAdi,
    'Vardiya': g.vardiya,
    'Giriş Saati': g.giris || '-',
    'Çıkış Saati': g.cikis || '-',
    'Çalışılan Saat': g.calisilanSaat,
    'Fazla Mesai (Saat)': g.fazlaMesai,
    'Durum / İzin Tipi': g.durum,
    'Açıklama': g.aciklama || '-'
  }));

  try {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelVerisi);
    const workbook: XLSX.WorkBook = { 
      Sheets: { 'Aylık Puantaj': worksheet }, 
      SheetNames: ['Aylık Puantaj'] 
    };

    const dosyaAdi = `Puantaj_${this.secilenAylikPersonelAd.replace(/\s+/g, '_')}_${this.secilenAylikTarih}.xlsx`;
    
    // Dosyayı indirmeyi tetikle
    XLSX.writeFile(workbook, dosyaAdi);
  } catch (error) {
    console.error('Excel indirilirken hata oluştu:', error);
    alert('Excel dosyası oluşturulurken bir hata oluştu. Konsolu kontrol ediniz.');
  }
}

onDirektorlikChange() {
    this.secilenMudurluk = '';
    this.secilenBasmuhendislik = '';
    this.secilenBolum = '';
    this.personelListesi = [];

    if (this.secilenDirektorlik === 'DIR_1') {
      this.mudurlukler = [
        { id: 'MUD_1', ad: 'Haddehane Müdürlüğü' },
        { id: 'MUD_2', ad: 'Çelikhane Müdürlüğü' }
      ];
    } else if (this.secilenDirektorlik === 'DIR_2') {
      this.mudurlukler = [
        { id: 'MUD_3', ad: 'Bakım Onarım Müdürlüğü' }
      ];
    } else {
      this.mudurlukler = [];
    }
  }

  onMudurlukChange() {
    this.secilenBasmuhendislik = '';
    this.secilenBolum = '';
    this.personelListesi = [];

    this.basmuhendislikler = [
      { id: 'BAS_1', ad: 'İşletme Başmühendisliği' },
      { id: 'BAS_2', ad: 'Mekanik Başmühendisliği' }
    ];
  }

  onBasmuhendislikChange() {
    this.secilenBolum = '';
    this.personelListesi = [];

    this.bolumler = [
      { id: 'BOL_1', ad: 'Fırın Bölümü' },
      { id: 'BOL_2', ad: 'Hat & Haddeleme Bölümü' }
    ];
  }

  onBolumChange() {
    if (this.secilenBolum) {
      this.personelListesi = [
        { sicilNo: '1001', adSoyad: 'Personel A', girisSaati: '08:00', cikisSaati: '16:00', otomatikDurum: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretAciklamasi: '' },
        { sicilNo: '1002', adSoyad: 'Personel B', girisSaati: '08:00', cikisSaati: '16:00', otomatikDurum: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretAciklamasi: '' },
        { sicilNo: '1003', adSoyad: 'Personel C', girisSaati: '08:00', cikisSaati: '16:00', otomatikDurum: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretAciklamasi: '' }
      ];
    } else {
      this.personelListesi = [];
    }
  }

  onVardiyaTipiChange() {
    let baslangic = '08:00';
    let bitis = '16:00';

    if (this.genelPlanlananVardiya === '16:00-24:00') {
      baslangic = '16:00';
      bitis = '00:00';
    } else if (this.genelPlanlananVardiya === '24:00-08:00') {
      baslangic = '00:00';
      bitis = '08:00';
    }

    this.personelListesi.forEach(p => {
      p.girisSaati = baslangic;
      p.cikisSaati = bitis;
      p.otomatikDurum = 'NORMAL (8 Saat)';
    });
  }

  hesaplaDurum(p: any) {
    if (!p.girisSaati && !p.cikisSaati) {
      p.otomatikDurum = 'GELMEDİ (DEVAMSIZ)';
      return;
    }

    if (p.girisSaati && p.cikisSaati) {
      const gSaat = parseInt(p.girisSaati.split(':')[0], 10);
      const cSaat = parseInt(p.cikisSaati.split(':')[0], 10);
      let fark = cSaat - gSaat;
      if (fark < 0) fark += 24;

      if (fark === 8) {
        p.otomatikDurum = 'NORMAL (8 Saat)';
        p.mazeretTuru = '';
      } else if (fark > 8) {
        p.otomatikDurum = `FAZLA MESAİ (+${fark - 8} Saat)`;
      } else {
        p.otomatikDurum = `ERKEN ÇIKTI (${8 - fark} Saat Eksik)`;
      }
    } else {
      p.otomatikDurum = 'EKSİK KART BASIMI';
    }
  }

  topluKaydet() {
    alert('Bölüm puantajı ve mazeret kayıtları başarıyla kaydedildi!');
  }
}