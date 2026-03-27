# 🌿 Büyü — Bitki Bakım Uygulaması

Bitkilerini asla öldürme! Büyü, bitkilerini takip eden, sulama hatırlatması gönderen ve AI ile fotoğraftan bitki tanıyan React Native uygulamasıdır.

## Özellikler

- 📷 **AI Bitki Tanıma** — Fotoğraf çek, Claude API bitkini tanısın
- 💧 **Sulama Takibi** — Her bitkiye özel sulama takvimi
- 🔔 **Bildirimler** — Sulama vakti gelince hatırlatma
- 📋 **Bakım Geçmişi** — Tüm sulama ve gübre kayıtları
- 🌿 **10+ Bitki Veritabanı** — Hazır bakım bilgileriyle
- 📊 **İstatistikler** — Bahçen hakkında özet bilgiler

## Kurulum

### Gereksinimler
- Node.js 18+
- Expo CLI
- iOS Simulator veya Android Emulator (veya gerçek telefon)

### Adımlar

```bash
# 1. Klasöre gir
cd bugyu-app

# 2. Bağımlılıkları yükle
npm install

# 3. Uygulamayı başlat
npx expo start
```

### Telefonda Çalıştırma (En Kolay Yol)
1. App Store / Play Store'dan **Expo Go** uygulamasını indir
2. `npx expo start` çalıştır
3. QR kodu Expo Go ile tara
4. Uygulama açılır! ✅

## Klasör Yapısı

```
bugyu-app/
├── App.js                    # Ana uygulama, navigasyon
├── theme.js                  # Renkler ve stiller
├── context/
│   └── PlantContext.js       # Global state yönetimi
├── data/
│   └── plantDatabase.js      # Bitki veritabanı + yardımcı fonksiyonlar
├── screens/
│   ├── GardenScreen.js       # Ana bahçe ekranı
│   ├── AddPlantScreen.js     # Bitki ekleme (AI tanıma dahil)
│   ├── PlantDetailScreen.js  # Bitki detay ekranı
│   ├── CareLogScreen.js      # Bakım geçmişi
│   └── ProfileScreen.js      # İstatistikler
├── package.json
├── app.json
└── babel.config.js
```

## AI Entegrasyonu

`AddPlantScreen.js` içinde fotoğraftan bitki tanıma için **Claude API** kullanılıyor.

Uygulama production'a geçmeden önce:
1. Anthropic API key'ini backend'e taşı (güvenlik için)
2. Kendi backend endpoint'ini yaz
3. Frontend'den o endpoint'i çağır

Şu an API key doğrudan çağrılıyor — bu **sadece geliştirme** için uygundur.

## Genişletme Fikirleri

- 🌡️ Mevsimsel bakım değişiklikleri
- 📸 Büyüme fotoğraf galerisi (zaman serileri)
- 👯 Arkadaşlarla bahçe paylaşımı
- 🛍️ Toprak/saksı satın alma önerileri
- 🏥 Hastalık teşhisi (yaprak sararmasi vb.)
- 🌍 Hava durumu entegrasyonu (dışarıdaysa sulama gerekmiyor)

## Teknolojiler

- **React Native** + **Expo** — Cross-platform mobil
- **React Navigation** — Ekranlar arası geçiş
- **AsyncStorage** — Lokal veri saklama
- **Expo Notifications** — Push bildirimler
- **Expo Image Picker** — Kamera / Galeri
- **Claude API** — AI bitki tanıma
