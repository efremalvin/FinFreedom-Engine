# FinFreedom Engine 🇮🇩
### Interactive Financial Independence (FIRE) & SWR Retirement Stress-Test Simulator

Sebuah aplikasi dan komponen interaktif FinTech modern berbasis **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, dan **Recharts**.

---

## 🚀 Fitur Unggulan

### 1. Modul A: Akumulasi Dana Menuju Financial Freedom (Wealth Accumulation)
- **Parameter Interaktif:** Modal Awal (Rp), Investasi Rutin Bulanan (DCA), Target Pengeluaran Hidup Bulanan, Imbal Hasil Bersih (%/tahun), Inflasi (%/tahun), dan Horison Waktu.
- **Formula Majemuk Bulanan:**
  $$A_t = P \times (1 + r/12)^{12t} + PMT \times \frac{(1 + r/12)^{12t} - 1}{r/12}$$
- **Target Dana FIRE:** Penyesuaian pengali SWR fleksibel:
  - `25x` (Rule of 4% Trinity Study AS)
  - `28.5x` (SWR 3.5% Moderat Indonesia)
  - `30.8x` (SWR 3.25% Konservatif Indonesia)
- **Deteksi Otomatis:** Deteksi tahun pencapaian target FIRE beserta passive income aman bulanan.
- **Visualisasi Recharts:** AreaChart dengan gradien ganda (Total Portofolio Bunga Bergulung vs Modal Pokok Disetor) dan `ReferenceLine` Target FIRE.

### 2. Modul B: Uji Ketahanan Portofolio Pensiun (Decumulation & SWR Stress-Test)
- **Parameter Interaktif:** Saldo Awal Pensiun, Pengeluaran Tahun Pertama (Auto 4% atau kustom), Imbal Hasil Campuran Pensiun, Inflasi Rata-rata, dan Lama Pensiun (10–40 Tahun).
- **Simulasi Komparasi Head-to-Head:**
  - **Skenario Standar SWR 4.0% (Trinity AS):** Penarikan awal 4% disesuaikan inflasi tahunan.
  - **Skenario SWR 3.25% (Adaptasi Indonesia):** Penarikan awal konservatif 3.25% disesuaikan inflasi tahunan.
- **Visual Failure Detection:** Banner dan badge peringatan visual saat portofolio menyentuh Rp0 (*portfolio failure / run out of money*) beserta tahun kegagalan spesifik.
- **Visualisasi Recharts:** Kurva komparasi interaktif sisa saldo tahunan dengan `ReferenceLine` batas saldo Rp0.

---

## 🛠️ Menjalankan Proyek

```bash
# 1. Jalankan development server
npm run dev

# 2. Buka browser pada
http://localhost:3000

# 3. Build untuk produksi
npm run build
```

---

## 📁 Struktur File

```
FinFreedom-Engine/
├── src/
│   ├── app/
│   │   ├── globals.css         # Styling Tailwind & Dark Theme
│   │   ├── layout.tsx          # Root Layout & Metadata
│   │   └── page.tsx            # Showcase Dashboard Page
│   ├── components/
│   │   ├── FinFreedomEngine.tsx # Komponen Interaktif Utama Simulator
│   │   └── ui/
│   │       └── NumericSliderInput.tsx # Slider + Input Numerik Sinkron Dua Arah
│   ├── types/
│   │   └── simulator.ts        # Type Definitions TypeScript
│   └── utils/
│       ├── financialCalculations.ts # Rumus Matematika Akumulasi & Dekumulasi
│       └── formatters.ts       # Format Rupiah (IDR), Compact IDR, & Persen
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
