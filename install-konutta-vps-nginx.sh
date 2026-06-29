#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-konutta.com}"
WWW_DOMAIN="${WWW_DOMAIN:-www.konutta.com}"
WEBROOT="${WEBROOT:-/var/www/konutta.com}"
REPO_ZIP_URL="https://github.com/mutluataberkoymak-spec/parla-modern-web/archive/refs/heads/main.zip"
STAMP="$(date +%Y%m%d-%H%M%S)"
WORKDIR="/tmp/konutta-nginx-install-$STAMP"

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: Bu script root yetkisiyle çalışmalı. Komutu sudo ile çalıştırın." >&2
  echo "Örnek: curl -L https://mutluataberkoymak-spec.github.io/parla-modern-web/install-konutta-vps-nginx.sh | sudo bash" >&2
  exit 1
fi

printf '\n== Konutta.com VPS Nginx Installer ==\n'
printf 'DOMAIN: %s\nWWW_DOMAIN: %s\nWEBROOT: %s\n\n' "$DOMAIN" "$WWW_DOMAIN" "$WEBROOT"

# Detect package manager and install required packages
if command -v apt-get >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y nginx curl unzip ca-certificates
elif command -v dnf >/dev/null 2>&1; then
  dnf install -y nginx curl unzip ca-certificates
elif command -v yum >/dev/null 2>&1; then
  yum install -y nginx curl unzip ca-certificates
else
  echo "ERROR: apt, dnf veya yum bulunamadı. Nginx/curl/unzip elle kurulmalı." >&2
  exit 1
fi

mkdir -p "$WORKDIR" "$WEBROOT"
cd "$WORKDIR"
curl -L "$REPO_ZIP_URL" -o site.zip
unzip -q site.zip
SRC_DIR="$(find . -maxdepth 1 -type d -name 'parla-modern-web-*' | head -1)"
if [ -z "$SRC_DIR" ]; then
  echo "ERROR: Site arşiv klasörü bulunamadı." >&2
  exit 1
fi

if [ -d "$WEBROOT" ] && [ "$(find "$WEBROOT" -mindepth 1 -maxdepth 1 | wc -l | tr -d ' ')" != "0" ]; then
  BACKUP="${WEBROOT%/}-backup-$STAMP"
  echo "Mevcut webroot yedekleniyor: $BACKUP"
  mkdir -p "$BACKUP"
  cp -a "$WEBROOT"/. "$BACKUP"/
fi

find "$WEBROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a "$SRC_DIR"/. "$WEBROOT"/
chown -R www-data:www-data "$WEBROOT" 2>/dev/null || chown -R nginx:nginx "$WEBROOT" 2>/dev/null || true
find "$WEBROOT" -type d -exec chmod 755 {} +
find "$WEBROOT" -type f -exec chmod 644 {} +

# Nginx config paths
if [ -d /etc/nginx/sites-available ]; then
  CONF_AVAILABLE="/etc/nginx/sites-available/konutta.com"
  CONF_ENABLED="/etc/nginx/sites-enabled/konutta.com"
  cat > "$CONF_AVAILABLE" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $WWW_DOMAIN;
    root $WEBROOT;
    index index.html;

    access_log /var/log/nginx/konutta.access.log;
    error_log /var/log/nginx/konutta.error.log;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(css|js|png|jpg|jpeg|gif|svg|webp|ico)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        try_files \$uri =404;
    }
}
NGINX
  ln -sf "$CONF_AVAILABLE" "$CONF_ENABLED"
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
else
  CONF_AVAILABLE="/etc/nginx/conf.d/konutta.com.conf"
  cat > "$CONF_AVAILABLE" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $WWW_DOMAIN;
    root $WEBROOT;
    index index.html;

    access_log /var/log/nginx/konutta.access.log;
    error_log /var/log/nginx/konutta.error.log;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(css|js|png|jpg|jpeg|gif|svg|webp|ico)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        try_files \$uri =404;
    }
}
NGINX
fi

nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx || service nginx restart

echo
echo "Kurulum tamamlandı. Kontrol:"
[ -f "$WEBROOT/index.html" ] && echo "OK index.html" || { echo "MISSING index.html"; exit 1; }
[ -f "$WEBROOT/ilanlar.html" ] && echo "OK ilanlar.html" || { echo "MISSING ilanlar.html"; exit 1; }
[ -f "$WEBROOT/guven-merkezi.html" ] && echo "OK guven-merkezi.html" || { echo "MISSING guven-merkezi.html"; exit 1; }
[ -f "$WEBROOT/panel.html" ] && echo "OK panel.html" || { echo "MISSING panel.html"; exit 1; }

curl -I --max-time 10 http://127.0.0.1/ || true

echo
echo "DNS düzeldikten sonra SSL için Ubuntu/Debian'da:"
echo "apt-get install -y certbot python3-certbot-nginx && certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"
echo
echo "DONE: Konutta.com Nginx kurulumu tamamlandı."
