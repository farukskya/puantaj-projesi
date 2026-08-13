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
  sifre?: string;
  rol?: 'ADMIN' | 'ISCI';
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
  isLoggedIn: boolean = false;
  loginSicil: string = '';
  loginSifre: string = '';
  loginHata: string = '';
  currentUser: Personel | null = null;

  isDarkMode: boolean = false;
  aramaMetni: string = '';
  aktifSekme: 'gunluk' | 'aylik' | 'profil' = 'gunluk';

  profilSifre: string = '';

  secilenTarih: string = '2026-08-12';
  secilenVardiya: string = '08:00 - 16:00';
  secilenAmir: string = '';
  secilenDirektorlik: string = '';
  secilenMudurluk: string = '';
  secilenBasmuhendislik: string = '';
  secilenBolum: string = '';

  seciliPersonel: Personel | null = null;

  isSaving: boolean = false;
  showSuccessToast: boolean = false;
  toastMessage: string = '';

  toplamFiiliCalisma: number = 0;
  toplamHaftaIzni: number = 0;
  toplamResmiTatil: number = 0;
  toplamMazeret: number = 0;
  toplamDevamsiz: number = 0;
  toplamCalisilanSaatMetni: string = '0 Saat 0 Dakika';

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

  private personelAylikGecmis: { [key: string]: GunlukPuantaj[] } = {};

  private mockPersonelDeposu: { [key: string]: Personel[] } = {
    'Puantaj ve İK Sistemleri Birimi': [
      { sicilNo: 'PER-1021', adSoyad: 'Ahmet Yılmaz', girisSaati: '08:00', cikisSaati: '16:00', durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '', sifre: '1234', rol: 'ISCI' },
      { sicilNo: 'PER-1045', adSoyad: 'Mehmet Demir', girisSaati: '08:00', cikisSaati: '14:00', durum: 'ERKEN_CIKTI', durumMetni: 'ERKEN ÇIKTI (2 Saat Eksik)', mazeretTuru: 'Doktor Sevk', mazeretNotu: 'Poliklinik randevusu', sifre: '1234', rol: 'ISCI' },
      { sicilNo: 'PER-1088', adSoyad: 'Mustafa Kaya', girisSaati: '08:15', cikisSaati: '16:00', durum: 'EKSİK_KART', durumMetni: 'GEÇ GELDİ', mazeretTuru: 'İdari İzin', mazeretNotu: 'Saha denetimi', sifre: '1234', rol: 'ISCI' },
      { sicilNo: 'PER-1102', adSoyad: 'Ayşe Çelik', girisSaati: '08:00', cikisSaati: '16:00', durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '', sifre: '1234', rol: 'ISCI' }
    ]
  };

  ngOnInit() {
    this.generate30GunlukPuantaj();
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  get filtrelenmisPersoneller(): Personel[] {
    if (!this.aramaMetni.trim()) return this.personelListesi;
    const q = this.aramaMetni.toLowerCase().trim();
    return this.personelListesi.filter(p => 
      p.adSoyad.toLowerCase().includes(q) || p.sicilNo.toLowerCase().includes(q)
    );
  }

  girisYap() {
    this.loginHata = '';
    let foundUser: Personel | null = null;

    Object.keys(this.mockPersonelDeposu).forEach(key => {
      const p = this.mockPersonelDeposu[key].find(u => u.sicilNo.toUpperCase() === this.loginSicil.trim().toUpperCase());
      if (p) foundUser = p;
    });

    if (!foundUser && (this.loginSicil.toUpperCase() === 'ADMIN' || this.loginSicil.toUpperCase() === '1001')) {
      foundUser = {
        sicilNo: 'ADMIN',
        adSoyad: 'Sistem Yöneticisi',
        girisSaati: '08:00',
        cikisSaati: '16:00',
        durum: 'NORMAL',
        durumMetni: 'NORMAL',
        mazeretTuru: '',
        mazeretNotu: '',
        sifre: '1234',
        rol: 'ADMIN'
      };
    }

    if (foundUser && (this.loginSifre === (foundUser as Personel).sifre || this.loginSifre === '1234')) {
      this.currentUser = foundUser;
      this.profilSifre = this.currentUser.sifre || '1234';
      this.isLoggedIn = true;

      if (this.currentUser.rol === 'ISCI') {
        this.seciliPersonel = this.currentUser;
        this.aktifSekme = 'aylik';
        if (!this.personelAylikGecmis[this.currentUser.sicilNo]) {
          this.generatePersonelGecmis(this.currentUser.sicilNo);
        }
        this.aylikPuantajListesi = this.personelAylikGecmis[this.currentUser.sicilNo];
        this.aylikOzetHesapla();
      } else {
        this.aktifSekme = 'gunluk';
      }
    } else {
      this.loginHata = 'Giriş Başarısız! Sicil No veya Şifre Hatalı. (Örn Sicil: ADMIN veya PER-1021, Şifre: 1234)';
    }
  }

  cikisYap() {
    this.isLoggedIn = false;
    this.currentUser = null;
    this.loginSicil = '';
    this.loginSifre = '';
    document.body.classList.remove('dark-theme');
    this.isDarkMode = false;
  }

  profilKaydet() {
    if (this.currentUser) {
      this.currentUser.sifre = this.profilSifre;
      this.toastMessage = 'Giriş şifreniz başarıyla güncellendi!';
      this.showSuccessToast = true;
      setTimeout(() => this.showSuccessToast = false, 3000);
    }
  }

  private dakikaFormatla(toplamDakika: number): string {
    const saat = Math.floor(Math.abs(toplamDakika) / 60);
    const dakika = Math.round(Math.abs(toplamDakika) % 60);
    let metin = '';
    if (saat > 0) metin += `${saat} Saat `;
    if (dakika > 0 || saat === 0) metin += `${dakika} Dakika`;
    return metin.trim();
  }

  hesaplaDurum(p: Personel) {
    if (!p.girisSaati || !p.cikisSaati) {
      p.durum = 'EKSİK_KART';
      p.durumMetni = 'EKSİK KART';
      return;
    }

    const [girisSaat, girisDakika] = p.girisSaati.split(':').map(Number);
    const [cikisSaat, cikisDakika] = p.cikisSaati.split(':').map(Number);

    const girisToplamDakika = girisSaat * 60 + girisDakika;
    let cikisToplamDakika = cikisSaat * 60 + cikisDakika;

    if (cikisToplamDakika === 0 && girisToplamDakika > 0) {
      cikisToplamDakika = 24 * 60;
    }

    const calisilanDakika = cikisToplamDakika - girisToplamDakika;
    const normalVardiyaDakika = 8 * 60;

    if (calisilanDakika > normalVardiyaDakika) {
      const farkDakika = calisilanDakika - normalVardiyaDakika;
      p.durum = 'FAZLA_MESAI';
      p.durumMetni = `FAZLA MESAİ (${this.dakikaFormatla(farkDakika)})`;
    } else if (calisilanDakika === normalVardiyaDakika) {
      p.durum = 'NORMAL';
      p.durumMetni = 'NORMAL (8 Saat)';
    } else if (calisilanDakika > 0 && calisilanDakika < normalVardiyaDakika) {
      const farkDakika = normalVardiyaDakika - calisilanDakika;
      p.durum = 'ERKEN_CIKTI';
      p.durumMetni = `ERKEN ÇIKTI (${this.dakikaFormatla(farkDakika)} Eksik)`;
    } else {
      p.durum = 'EKSİK_KART';
      p.durumMetni = 'GEÇERSİZ SAAT';
    }
  }

  onVardiyaChange() {
    let yeniGiris = '08:00';
    let yeniCikis = '16:00';

    if (this.secilenVardiya.includes('16:00 - 24:00')) {
      yeniGiris = '16:00';
      yeniCikis = '00:00';
    } else if (this.secilenVardiya.includes('00:00 - 08:00')) {
      yeniGiris = '00:00';
      yeniCikis = '08:00';
    } else {
      yeniGiris = '08:00';
      yeniCikis = '16:00';
    }

    if (this.personelListesi && this.personelListesi.length > 0) {
      this.personelListesi.forEach(p => {
        p.girisSaati = yeniGiris;
        p.cikisSaati = yeniCikis;
        this.hesaplaDurum(p);
      });
    }
  }

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
      this.mudurlukler = ['Genel Müdürlük'];
    }
  }

  onMudurlukChange() {
    this.secilenBasmuhendislik = '';
    this.secilenBolum = '';
    this.bolumler = [];
    this.personelListesi = [];

    if (this.secilenMudurluk === 'Yazılım ve Otomasyon Müdürlüğü') {
      this.basmuhendislikler = ['Backend Yazılım Başmühendisliği', 'Endüstriyel Veri Başmühendisliği'];
    } else if (this.secilenMudurluk === 'Bakım Onarım Müdürlüğü') {
      this.basmuhendislikler = ['Saha Bakım Başmühendisliği', 'Mekanik Bakım Başmühendisliği'];
    } else {
      this.basmuhendislikler = ['Genel Hizmetler Başmühendisliği', 'Saha Operasyon Başmühendisliği'];
    }
  }

  onBasmuhendislikChange() {
    this.secilenBolum = '';
    this.personelListesi = [];

    if (this.secilenBasmuhendislik === 'Backend Yazılım Başmühendisliği') {
      this.bolumler = ['Puantaj ve İK Sistemleri Birimi', 'Saha Otomasyon Birimi'];
    } else if (this.secilenBasmuhendislik === 'Mekanik Bakım Başmühendisliği') {
      this.bolumler = ['Ağır Mekanik Ekibi', 'Hidrolik Sistemler Birimi'];
    } else {
      this.bolumler = ['Genel Vardiya Birimi', 'Saha Takip Birimi'];
    }
  }

  onBolumChange() {
    let giris = '08:00';
    let cikis = '16:00';

    if (this.secilenVardiya.includes('16:00 - 24:00')) {
      giris = '16:00';
      cikis = '00:00';
    } else if (this.secilenVardiya.includes('00:00 - 08:00')) {
      giris = '00:00';
      cikis = '08:00';
    }

    if (this.secilenBolum && this.mockPersonelDeposu[this.secilenBolum]) {
      this.personelListesi = JSON.parse(JSON.stringify(this.mockPersonelDeposu[this.secilenBolum]));
    } else if (this.secilenBolum) {
      const bolumKodu = Math.floor(1000 + Math.random() * 9000);
      this.personelListesi = [
        { sicilNo: `PER-${bolumKodu}`, adSoyad: 'Ali Öztürk', girisSaati: giris, cikisSaati: cikis, durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '', sifre: '1234', rol: 'ISCI' },
        { sicilNo: `PER-${bolumKodu + 1}`, adSoyad: 'Hasan Yurt', girisSaati: giris, cikisSaati: cikis, durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '', sifre: '1234', rol: 'ISCI' },
        { sicilNo: `PER-${bolumKodu + 2}`, adSoyad: 'Fatma Şahin', girisSaati: giris, cikisSaati: cikis, durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '', sifre: '1234', rol: 'ISCI' },
        { sicilNo: `PER-${bolumKodu + 3}`, adSoyad: 'Hüseyin Arslan', girisSaati: giris, cikisSaati: cikis, durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '', sifre: '1234', rol: 'ISCI' },
        { sicilNo: `PER-${bolumKodu + 4}`, adSoyad: 'Zeynep Kaya', girisSaati: giris, cikisSaati: cikis, durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '', sifre: '1234', rol: 'ISCI' }
      ];
    } else {
      this.personelListesi = [];
    }

    this.personelListesi.forEach(p => {
      p.girisSaati = giris;
      p.cikisSaati = cikis;
      this.hesaplaDurum(p);
    });
  }

  topluKaydet() {
    if (this.personelListesi.length === 0) return;

    this.isSaving = true;

    this.personelListesi.forEach(p => {
      this.hesaplaDurum(p);

      if (!this.personelAylikGecmis[p.sicilNo]) {
        this.generatePersonelGecmis(p.sicilNo);
      }

      const hedefGun = this.personelAylikGecmis[p.sicilNo].find(g => g.tarih === this.secilenTarih);
      if (hedefGun) {
        hedefGun.girisSaati = p.girisSaati;
        hedefGun.cikisSaati = p.cikisSaati;
        hedefGun.not = p.mazeretNotu || p.mazeretTuru || p.durumMetni;
        hedefGun.durum = p.mazeretTuru ? 'MAZERETLI' : p.durum;
      }
    });

    if (this.personelListesi.length > 0) {
      this.seciliPersonel = this.personelListesi[0];
      this.aylikPuantajListesi = this.personelAylikGecmis[this.seciliPersonel.sicilNo];
      this.aylikOzetHesapla();
    }

    setTimeout(() => {
      this.isSaving = false;
      this.toastMessage = `${this.secilenTarih} tarihli personel puantajı başarıyla kaydedildi!`;
      this.showSuccessToast = true;
      setTimeout(() => this.showSuccessToast = false, 3500);
    }, 500);
  }

  personelAylikDetayGit(p: Personel) {
    this.seciliPersonel = p;
    this.hesaplaDurum(p);

    if (!this.personelAylikGecmis[p.sicilNo]) {
      this.generatePersonelGecmis(p.sicilNo);
    }

    const hedefGun = this.personelAylikGecmis[p.sicilNo].find(g => g.tarih === this.secilenTarih);
    if (hedefGun) {
      hedefGun.girisSaati = p.girisSaati;
      hedefGun.cikisSaati = p.cikisSaati;
      hedefGun.not = p.mazeretNotu || p.mazeretTuru || p.durumMetni;
      hedefGun.durum = p.mazeretTuru ? 'MAZERETLI' : p.durum;
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
    this.toplamDevamsiz = this.aylikPuantajListesi.filter(g => g.durum === 'DEVAMSIZ' || g.durum === 'ERKEN_CIKTI' || g.durum === 'EKSİK_KART').length;

    let toplamDakika = 0;
    this.aylikPuantajListesi.forEach(g => {
      if (g.girisSaati && g.cikisSaati && g.girisSaati !== '-' && g.cikisSaati !== '-') {
        const [gS, gD] = g.girisSaati.split(':').map(Number);
        const [cS, cD] = g.cikisSaati.split(':').map(Number);
        let dk = (cS * 60 + cD) - (gS * 60 + gD);
        if (dk < 0 && cS === 0) dk += 24 * 60;
        if (dk > 0) toplamDakika += dk;
      }
    });

    this.toplamCalisilanSaatMetni = this.dakikaFormatla(toplamDakika);
  }

  excelIndir() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.aylikPuantajListesi);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aylık Puantaj');
    const isim = this.seciliPersonel ? this.seciliPersonel.adSoyad.replace(/\s+/g, '_') : 'Genel';
    XLSX.writeFile(wb, `Puantaj_${isim}_2026_08.xlsx`);
  }
}