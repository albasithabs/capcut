# Wavespeed.ai Auto Referral System

Sistem automasi untuk membuat akun referral di wavespeed.ai secara otomatis.

## 🚀 Fitur

- ✅ Pembuatan email temporary otomatis
- ✅ Registrasi akun dengan kode referral
- ✅ Verifikasi email otomatis
- ✅ Rotasi User Agent
- ✅ Delay konfigurabel antar akun
- ✅ Logging berwarna dan informatif
- ✅ Penyimpanan akun yang berhasil

## 📋 Prerequisites

- Node.js (version 18 atau lebih tinggi)
- npm atau pnpm

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Konfigurasi referral code di `wavespeed-config.json`:
```json
{
  "referralCode": "KODE_REFERRAL_ANDA",
  "password": "PasswordDefault123!",
  "maxAccounts": 10,
  "delayBetweenAccounts": 5000
}
```

## 🎯 Usage

### Metode 1: Menggunakan config file
```bash
node wavespeed-referral.js
```

### Metode 2: Dengan parameter
```bash
node wavespeed-referral.js [jumlah_akun] [kode_referral]
```

### Contoh:
```bash
# Membuat 5 akun dengan kode referral ABC123
node wavespeed-referral.js 5 ABC123

# Membuat 10 akun menggunakan config default
node wavespeed-referral.js 10
```

## ⚙️ Konfigurasi

Edit file `wavespeed-config.json`:

```json
{
  "referralCode": "KODE_REFERRAL_ANDA",
  "password": "PasswordDefault123!",
  "maxAccounts": 10,
  "delayBetweenAccounts": 5000,
  "userAgents": [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36..."
  ]
}
```

### Parameter:
- `referralCode`: Kode referral Anda di wavespeed.ai
- `password`: Password default untuk semua akun
- `maxAccounts`: Jumlah maksimal akun yang akan dibuat
- `delayBetweenAccounts`: Delay dalam ms antar pembuatan akun
- `userAgents`: Array user agent untuk rotasi

## 📁 Output

Akun yang berhasil dibuat akan disimpan di `wavespeed-accounts.txt` dengan format:
```
email@domain.com|password|referral_code
email2@domain.com|password|referral_code
```

## 🔧 Troubleshooting

### Error: "Please provide a referral code"
- Pastikan `referralCode` di config.json sudah diisi
- Atau berikan kode referral sebagai parameter

### Error: "Failed to generate email"
- Coba jalankan ulang, service temp-mail.io mungkin sedang down
- Periksa koneksi internet

### Error: "All registration endpoints failed"
- Wavespeed.ai mungkin mengubah API endpoint
- Periksa apakah situs masih aktif
- Mungkin perlu update script

## ⚠️ Disclaimer

- Gunakan dengan bijak dan sesuai Terms of Service wavespeed.ai
- Script ini untuk tujuan edukasi dan testing
- Penulis tidak bertanggung jawab atas penyalahgunaan
- Pastikan Anda memiliki izin untuk menggunakan program referral

## 🤝 Contributing

Jika menemukan bug atau ingin menambah fitur:
1. Fork repository
2. Buat branch baru
3. Commit perubahan
4. Submit pull request

## 📝 License

ISC License - lihat file LICENSE untuk detail.