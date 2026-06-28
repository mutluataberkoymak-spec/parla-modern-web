# Sahibinden JSON Aktarım Şeması

Bu dosya, Sahibinden portföylerini Parla modern web sitesine aktarmak için beklenen JSON yapısını açıklar.

## Desteklenen kök yapılar

### 1. Array

```json
[
  { "ilan_no": "123", "baslik": "..." }
]
```

### 2. Object + listings

```json
{
  "source": "sahibinden",
  "listings": [
    { "ilan_no": "123", "baslik": "..." }
  ]
}
```

## Alan eşleştirme

| Sahibinden JSON alanı | Web sitesi portföy alanı |
|---|---|
| `ilan_no`, `id` | `id` |
| `baslik`, `title` | `title` |
| `islem_tipi`, `durum`, `type` | `type` |
| `kategori`, `category` | `category` |
| `fiyat`, `price` | `price` |
| `il`, `ilce`, `mahalle`, `location` | `location` |
| `m2_brut`, `m2`, `sqm` | `sqm` |
| `oda_sayisi`, `rooms` | `rooms` |
| `aciklama`, `description` | `description` |
| `danisman`, `advisor` | `advisor` |
| `telefon`, `phone` | `phone` |
| `fotograflar`, `photos`, `images` | `photos` |
| `ozellikler.ic` | `features.interior` |
| `ozellikler.dis` | `features.exterior` |
| `ozellikler.muhit` | `features.neighborhood` |
| `ozellikler.ulasim` | `features.transport` |
| `ozellikler.manzara` | `features.view` |

## Güvenlik / gizlilik

- Sahibinden’den indirilen gerçek müşteri telefonu, tapu, kimlik, evrak ve özel notlar GitHub’a yüklenmemelidir.
- Gerçek JSON dosyaları lokal tutulmalıdır.
- Web sitesindeki mevcut demo modül kayıtları `localStorage` içine alır; gerçek üretimde bu akış backend/veritabanına taşınmalıdır.

## Sahibinden’den indirme notu

Sahibinden tarafı login, Cloudflare, CAPTCHA veya güvenlik doğrulaması isteyebilir. Bu adımlar kullanıcı tarafından manuel tamamlanmalıdır. Oturum hazır olduktan sonra yerel Safari/Browser Use üzerinden portföyler JSON olarak dışa aktarılabilir.
