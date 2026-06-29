# Konutta.com DNS Bağlama Notu

## Mevcut durum

`konutta.com` ve `www.konutta.com` şu anda yanlış IP'ye gidiyor:

```txt
konutta.com      A 192.168.1.1
www.konutta.com  A 192.168.1.1
```

`192.168.1.1` internette yayın yapılacak bir web hosting IP'si değildir; çoğunlukla modem/router yerel IP'sidir. Bu yüzden kullanıcı tarayıcısında site açılmıyor veya ZTE/modem hata sayfası dönebiliyor.

Geçici çalışan yayın adresi:

```txt
https://mutluataberkoymak-spec.github.io/parla-modern-web/
```

## Yapılması gereken DNS kayıtları

Domain DNS panelinde eski `192.168.1.1` kayıtları silinmeli.

### Apex/root domain için

Host/Name: `@`

```txt
A 185.199.108.153
A 185.199.109.153
A 185.199.110.153
A 185.199.111.153
```

### www için

Host/Name: `www`

```txt
CNAME mutluataberkoymak-spec.github.io
```

## Silinmesi gerekenler

Aşağıdaki kayıtlar varsa silinmeli:

```txt
@   A     192.168.1.1
www A     192.168.1.1
www CNAME farklı hedef
```

## GitHub Pages özel domain adımı

DNS kayıtları doğruya döndükten sonra GitHub Pages repo ayarlarında custom domain şu şekilde verilmeli:

```txt
www.konutta.com
```

Ardından HTTPS certificate oluşması beklenmeli ve `Enforce HTTPS` açılmalı.

## Kontrol komutları

```bash
dig +short konutta.com A
dig +short www.konutta.com CNAME
curl -I https://www.konutta.com/
```

Beklenen sonuç:

```txt
konutta.com -> 185.199.108.153 / 109 / 110 / 111
www.konutta.com -> mutluataberkoymak-spec.github.io
https://www.konutta.com -> 200 OK
```

## Not

DNS yayılımı genellikle 5 dakika - 24 saat arasında sürebilir. TTL düşükse daha hızlı olur.
