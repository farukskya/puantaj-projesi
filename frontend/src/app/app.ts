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

  // Hiyerarşik Seçenekler
  direktorlikler: string[] = ['İnsan Kaynakları ve İdari İşler', 'Demir Çelik Üretim Direktörlüğü', 'Mühendislik & Otomasyon Direktörlüğü'];
  mudurlukler: string[] = [];
  basmuhendislikler: string[] = [];
  bolumler: string[] = [];

  personelListesi: Personel[] = [];
  aylikPuantajListesi: GunlukPuantaj[] = [];

  ngOnInit() {
    this.generate30GunlukPuantaj();
    this.aylikOzetHesapla();
  }

  // Hiyerarşik Açılır Menü Değişim Olayları
  onDirektorlikChange() {
    this.secilenMudurluk = '';
    this.secilenBasmuhendislik = '';
    this.secilenBolum = '';
    this.mudurlukler = this.secilenDirektorlik ? ['Yazılım ve Otomasyon Müdürlüğü', 'Sistem ve Ağ Yönetimi Müdürlüğü'] : [];
    this.basmuhendislikler = [];
    this.bolumler = [];
    this.personelListesi = [];
  }

  onMudurlukChange() {
    this.secilenBasmuhendislik = '';
    this.secilenBolum = '';
    this.basmuhendislikler = this.secilenMudurluk ? ['Backend Yazılım Başmühendisliği', 'Endüstriyel Veri Başmühendisliği'] : [];
    this.bolumler = [];
    this.personelListesi = [];
  }

  onBasmuhendislikChange() {
    this.secilenBolum = '';
    this.bolumler = this.secilenBasmuhendislik ? ['Puantaj ve İK Sistemleri Birimi', 'Saha Otomasyon Birimi'] : [];
    this.personelListesi = [];
  }

  onBolumChange() {
    if (this.secilenBolum) {
      this.personelListesi = [
        { sicilNo: 'KARD-1021', adSoyad: 'Ahmet Yılmaz', girisSaati: '08:00', cikisSaati: '16:00', durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '' },
        { sicilNo: 'KARD-1045', adSoyad: 'Mehmet Demir', girisSaati: '08:00', cikisSaati: '14:00', durum: 'ERKEN_CIKTI', durumMetni: 'ERKEN ÇIKTI (2 Saat Eksik)', mazeretTuru: 'Doktor Sevk', mazeretNotu: 'Hastane sevk kağıdı İK’ya teslim edildi.' },
        { sicilNo: 'KARD-1088', adSoyad: 'Mustafa Kaya', girisSaati: '08:15', cikisSaati: '16:00', durum: 'EKSİK_KART', durumMetni: 'GEÇ GELDİ / EKSİK KART', mazeretTuru: '', mazeretNotu: '' },
        { sicilNo: 'KARD-1102', adSoyad: 'Ayşe Çelik', girisSaati: '08:00', cikisSaati: '16:00', durum: 'NORMAL', durumMetni: 'NORMAL (8 Saat)', mazeretTuru: '', mazeretNotu: '' }
      ];
    } else {
      this.personelListesi = [];
    }
  }

  // Durum Hesaplayıcı
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

  // Toplu Kaydetme
  topluKaydet() {
    if (this.personelListesi.length === 0) {
      alert('Kaydedilecek personel verisi bulunamadı!');
      return;
    }

    this.isSaving = true;

    setTimeout(() => {
      this.isSaving = false;
      this.toastMessage = `${this.secilenTarih} tarihli bölüm puantajı ve mazeret kayıtları başarıyla kaydedildi!`;
      this.showSuccessToast = true;

      setTimeout(() => {
        this.showSuccessToast = false;
      }, 4000);
    }, 1000);
  }

  // 30 Günlük Puantaj Cetveli Üretici
  generate30GunlukPuantaj() {
    const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    this.aylikPuantajListesi = [];

    for (let i = 1; i <= 30; i++) {
      const gunIndex = (i + 4) % 7; // Ağustos 2026 örnek gün döngüsü
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

      this.aylikPuantajListesi.push({
        tarih: `2026-08-${i < 10 ? '0' + i : i}`,
        gunAdi: gunAdi,
        durum: durum,
        girisSaati: giris,
        cikisSaati: cikis,
        not: not
      });
    }
  }

  // Aylık Özet Hesaplama Metodu
  aylikOzetHesapla() {
    if (!this.aylikPuantajListesi) return;

    this.toplamFiiliCalisma = this.aylikPuantajListesi.filter(g => g.durum === 'NORMAL' || g.durum === 'FAZLA_MESAI').length;
    this.toplamHaftaIzni = this.aylikPuantajListesi.filter(g => g.durum === 'HAFTA_IZNI').length;
    this.toplamResmiTatil = this.aylikPuantajListesi.filter(g => g.durum === 'RESMI_TATIL').length;
    this.toplamMazeret = this.aylikPuantajListesi.filter(g => g.durum === 'MAZERETLI').length;
    this.toplamDevamsiz = this.aylikPuantajListesi.filter(g => g.durum === 'DEVAMSIZ').length;
  }

  // Excel Dışa Aktarımı (.xlsx)
  excelIndir() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.aylikPuantajListesi);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aylık Puantaj');
    XLSX.writeFile(wb, `Puantaj_Raporu_2026_08.xlsx`);
  }
}