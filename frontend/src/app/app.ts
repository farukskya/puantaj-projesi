import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

interface Personel {
  sicilNo: string;
  adSoyad: string;
  girisSaati: string;
  cikisSaati: string;
  durum: string;
  durumMetni: string;
  mazeretTuru: string;
  mazeretNotu: string;
}

interface GunlukPuantaj {
  tarih: string;
  gunAdi: string;
  durum: string;
  girisSaati: string;
  cikisSaati: string;
  not: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  aktifSekme: 'gunluk' | 'aylik' = 'gunluk';

  // Seçim Değişkenleri
  secilenTarih: string = '2026-08-12';
  secilenVardiya: string = '08:00 - 16:00';
  secilenAmir: string = '';
  secilenDirektorlik: string = '';
  secilenMudurluk: string = '';
  secilenBasmuhendislik: string = '';
  secilenBolum: string = '';

  // Seçili Personel Bilgisi (Aylık Detay İçin)
  seciliPersonel: Personel | null = null;

  // Kayıt ve Bildirim Durumları
  isSaving: boolean = false;
  showSuccessToast: boolean = false;
  toastMessage: string = '';

  // İK Özet Sayaçları
  toplamFiiliCalisma: number = 0;
  toplamHaftaIzni: number = 0;
  toplamResmiTatil: number = 0;
  toplamMazeret: number = 0;
  toplamDevamsiz: number = 0;

  // Genel Hiyerarşik Seçenekler
  direktorlikler: string[] = [
    'Teknoloji ve Yazılım Direktörlüğü',
    'Üretim ve Operasyon Direktörlüğü',
    'İnsan Kaynakları Direktörlüğü'
  ];
  mudurlukler: string[] = [];
  basmuhendislikler: string[] = [];
  bolumler: string[] = [];

  personelListesi: Personel[] = [];
  aylikPuantajListesi: GunlukPuantaj[] = [];

  // Personellere Özel Kaydedilmiş Günlük Veri Deposu (Simülasyon DB)
  private personelAylikGecmis: { [key: string]: GunlukPuantaj[] } = {};

  // Mock Veri Deposu
  private mockPersonelDeposu: { [key: string]: Personel[] } = {
    'Puantaj ve İK Sistemleri Birimi': [
      { sicilNo: 'PER-1021', adSoyad: 'Ahmet Yılmaz', girisSaati: '08:00', cikisSaati: '16:00', durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '' },
      { sicilNo: 'PER-1045', adSoyad: 'Mehmet Demir', girisSaati: '08:00', cikisSaati: '14:00', durum: 'ERKEN_CIKTI', durumMetni: 'ERKEN ÇIKTI', mazeretTuru: 'Doktor Sevk', mazeretNotu: 'Poliklinik randevusu' },
      { sicilNo: 'PER-1088', adSoyad: 'Mustafa Kaya', girisSaati: '08:15', cikisSaati: '16:00', durum: 'EKSİK_KART', durumMetni: 'GEÇ GELDİ', mazeretTuru: 'İdari İzin', mazeretNotu: 'Saha denetimi' },
      { sicilNo: 'PER-1102', adSoyad: 'Ayşe Çelik', girisSaati: '08:00', cikisSaati: '16:00', durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '' }
    ],
    'Saha Otomasyon Birimi': [
      { sicilNo: 'PER-2011', adSoyad: 'Murat Öztürk', girisSaati: '08:00', cikisSaati: '16:00', durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '' },
      { sicilNo: 'PER-2034', adSoyad: 'Serhat Arslan', girisSaati: '08:00', cikisSaati: '16:00', durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '' }
    ]
  };

  ngOnInit() {
    this.generate30GunlukPuantaj();
  }

  // Hiyerarşik Seçim Olayları
  onDirektorlikChange() {
    this.secilenMudurluk = '';
    this.secilenBasmuhendislik = '';
    this.secilenBolum = '';
    this.basmuhendislikler = [];
    this.bolumler = [];
    this.personelListesi = [];

    if (this.secilenDirektorlik === 'Teknoloji ve Yazılım Direktörlüğü') {
      this.mudurlukler = ['Yazılım ve Otomasyon Müdürlüğü', 'Sistem ve Ağ Yönetimi Müdürlüğü'];
    } else if (this.secilenDirektorlik === 'Üretim ve Operasyon Direktörlüğü') {
      this.mudurlukler = ['Tesisler Müdürlüğü', 'Bakım Onarım Müdürlüğü'];
    } else if (this.secilenDirektorlik === 'İnsan Kaynakları Direktörlüğü') {
      this.mudurlukler = ['İşe Alım ve Özlük İşleri Müdürlüğü', 'Endüstriyel İlişkiler Müdürlüğü'];
    } else {
      this.mudurlukler = [];
    }
  }

  onMudurlukChange() {
    this.secilenBasmuhendislik = '';
    this.secilenBolum = '';
    this.bolumler = [];
    this.personelListesi = [];

    if (this.secilenMudurluk === 'Yazılım ve Otomasyon Müdürlüğü') {
      this.basmuhendislikler = ['Backend Yazılım Başmühendisliği', 'Endüstriyel Veri Başmühendisliği'];
    } else {
      this.basmuhendislikler = ['Genel Hizmetler Başmühendisliği'];
    }
  }

  onBasmuhendislikChange() {
    this.secilenBolum = '';
    this.personelListesi = [];

    if (this.secilenBasmuhendislik === 'Backend Yazılım Başmühendisliği') {
      this.bolumler = ['Puantaj ve İK Sistemleri Birimi', 'Saha Otomasyon Birimi'];
    } else {
      this.bolumler = ['Standart Çalışma Birimi'];
    }
  }

  onBolumChange() {
    if (this.secilenBolum && this.mockPersonelDeposu[this.secilenBolum]) {
      this.personelListesi = JSON.parse(JSON.stringify(this.mockPersonelDeposu[this.secilenBolum]));
    } else if (this.secilenBolum) {
      this.personelListesi = [
        { sicilNo: 'PER-9001', adSoyad: 'Örnek Personel 1', girisSaati: '08:00', cikisSaati: '16:00', durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '' },
        { sicilNo: 'PER-9002', adSoyad: 'Örnek Personel 2', girisSaati: '08:00', cikisSaati: '16:00', durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '' }
      ];
    } else {
      this.personelListesi = [];
    }
  }

  hesaplaDurum(p: Personel) {
    if (p.girisSaati === '08:00' && p.cikisSaati === '16:00') {
      p.durum = 'NORMAL';
      p.durumMetni = 'NORMAL (8 Saat)';
    } else if (p.cikisSaati < '16:00') {
      p.durum = 'ERKEN_CIKTI';
      p.durumMetni = 'ERKEN ÇIKTI';
    } else {
      p.durum = 'EKSİK_KART';
      p.durumMetni = 'GİRİŞ/ÇIKIŞ FARKLI';
    }
  }

  // TOPLU KAYDETME: Seçilen Tarihteki Değişiklikleri Personellerin Aylık Tablosuna İşler
  topluKaydet() {
    if (this.personelListesi.length === 0) {
      alert('Kaydedilecek personel verisi bulunamadı!');
      return;
    }

    this.isSaving = true;

    // Her Personel İçin Seçilen Tarihteki Değerleri Aylık Depoya İşle
    this.personelListesi.forEach(p => {
      if (!this.personelAylikGecmis[p.sicilNo]) {
        this.generatePersonelGecmis(p.sicilNo);
      }

      const hedefGun = this.personelAylikGecmis[p.sicilNo].find(g => g.tarih === this.secilenTarih);
      if (hedefGun) {
        hedefGun.girisSaati = p.girisSaati;
        hedefGun.cikisSaati = p.cikisSaati;
        hedefGun.not = p.mazeretNotu || p.mazeretTuru;

        if (p.mazeretTuru) {
          hedefGun.durum = 'MAZERETLI';
        } else if (p.durum === 'NORMAL') {
          hedefGun.durum = 'NORMAL';
        } else if (p.durum === 'ERKEN_CIKTI' || p.durum === 'EKSİK_KART') {
          hedefGun.durum = 'DEVAMSIZ';
        }
      }
    });

    // Varsayılan olarak listedeki ilk personeli aylık görünüm için seçili yapar
    if (this.personelListesi.length > 0) {
      this.seciliPersonel = this.personelListesi[0];
      this.aylikPuantajListesi = this.personelAylikGecmis[this.seciliPersonel.sicilNo];
      this.aylikOzetHesapla();
    }

    setTimeout(() => {
      this.isSaving = false;
      this.toastMessage = `${this.secilenTarih} tarihli ${this.personelListesi.length} personelin puantajı başarıyla kaydedildi!`;
      this.showSuccessToast = true;

      setTimeout(() => {
        this.showSuccessToast = false;
      }, 3500);
    }, 500);
  }

  // Kişiye Özel Aylık Detaya Gitme (Dinamik Canlı Veri İle)
  personelAylikDetayGit(p: Personel) {
    this.seciliPersonel = p;

    if (!this.personelAylikGecmis[p.sicilNo]) {
      this.generatePersonelGecmis(p.sicilNo);
    }

    // O anki tarih seçiminde girilmiş bilgileri güncel tut
    const hedefGun = this.personelAylikGecmis[p.sicilNo].find(g => g.tarih === this.secilenTarih);
    if (hedefGun) {
      hedefGun.girisSaati = p.girisSaati;
      hedefGun.cikisSaati = p.cikisSaati;
      hedefGun.not = p.mazeretNotu || p.mazeretTuru;
      if (p.mazeretTuru) hedefGun.durum = 'MAZERETLI';
    }

    this.aylikPuantajListesi = this.personelAylikGecmis[p.sicilNo];
    this.aylikOzetHesapla();
    this.aktifSekme = 'aylik';
  }

  generate30GunlukPuantaj() {
    this.aylikPuantajListesi = this.createBase30Gun();
    this.aylikOzetHesapla();
  }

  private generatePersonelGecmis(sicilNo: string) {
    this.personelAylikGecmis[sicilNo] = this.createBase30Gun();
  }

  private createBase30Gun(): GunlukPuantaj[] {
    const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const liste: GunlukPuantaj[] = [];

    for (let i = 1; i <= 30; i++) {
      const gunIndex = (i + 4) % 7;
      const gunAdi = gunler[gunIndex];
      let durum = 'NORMAL';
      let giris = '08:00';
      let cikis = '16:00';
      let not = '';

      if (gunAdi === 'Pazar') {
        durum = 'HAFTA_IZNI';
        giris = '-';
        cikis = '-';
      } else if (i === 30) {
        durum = 'RESMI_TATIL';
        giris = '-';
        cikis = '-';
        not = '30 Ağustos Zafer Bayramı';
      }

      liste.push({
        tarih: `2026-08-${i < 10 ? '0' + i : i}`,
        gunAdi: gunAdi,
        durum: durum,
        girisSaati: giris,
        cikisSaati: cikis,
        not: not
      });
    }

    return liste;
  }

  aylikOzetHesapla() {
    if (!this.aylikPuantajListesi) return;

    this.toplamFiiliCalisma = this.aylikPuantajListesi.filter(g => g.durum === 'NORMAL' || g.durum === 'FAZLA_MESAI').length;
    this.toplamHaftaIzni = this.aylikPuantajListesi.filter(g => g.durum === 'HAFTA_IZNI').length;
    this.toplamResmiTatil = this.aylikPuantajListesi.filter(g => g.durum === 'RESMI_TATIL').length;
    this.toplamMazeret = this.aylikPuantajListesi.filter(g => g.durum === 'MAZERETLI').length;
    this.toplamDevamsiz = this.aylikPuantajListesi.filter(g => g.durum === 'DEVAMSIZ').length;
  }

  excelIndir() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.aylikPuantajListesi);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aylık Puantaj');
    const isim = this.seciliPersonel ? this.seciliPersonel.adSoyad.replace(/\s+/g, '_') : 'Genel';
    XLSX.writeFile(wb, `Puantaj_${isim}_2026_08.xlsx`);
  }
}