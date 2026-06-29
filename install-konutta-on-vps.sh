#!/usr/bin/env bash
set -euo pipefail

# Konutta.com VPS/cPanel installer
# Usage:
#   bash install-konutta-on-vps.sh
#   bash install-konutta-on-vps.sh /home/USERNAME/public_html

WEBROOT="${1:-$HOME/public_html}"
REPO_ZIP_URL="https://github.com/mutluataberkoymak-spec/parla-modern-web/archive/refs/heads/main.zip"
STAMP="$(date +%Y%m%d-%H%M%S)"
WORKDIR="/tmp/konutta-install-$STAMP"

printf '\n== Konutta.com installer ==\n'
printf 'WEBROOT: %s\n' "$WEBROOT"
printf 'WORKDIR: %s\n\n' "$WORKDIR"

mkdir -p "$WEBROOT"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

if command -v curl >/dev/null 2>&1; then
  curl -L "$REPO_ZIP_URL" -o site.zip
elif command -v wget >/dev/null 2>&1; then
  wget -O site.zip "$REPO_ZIP_URL"
else
  echo "ERROR: curl veya wget bulunamadı." >&2
  exit 1
fi

if command -v unzip >/dev/null 2>&1; then
  unzip -q site.zip
else
  echo "ERROR: unzip bulunamadı. cPanel Terminal'de 'unzip' gerekli." >&2
  exit 1
fi

SRC_DIR="$(find . -maxdepth 1 -type d -name 'parla-modern-web-*' | head -1)"
if [ -z "$SRC_DIR" ]; then
  echo "ERROR: Arşiv klasörü bulunamadı." >&2
  exit 1
fi

# Backup current public_html if non-empty
if [ -d "$WEBROOT" ] && [ "$(find "$WEBROOT" -mindepth 1 -maxdepth 1 | wc -l | tr -d ' ')" != "0" ]; then
  BACKUP="${WEBROOT%/}-backup-$STAMP"
  printf 'Mevcut public_html yedekleniyor: %s\n' "$BACKUP"
  mkdir -p "$BACKUP"
  cp -a "$WEBROOT"/. "$BACKUP"/
fi

# Clean webroot safely
find "$WEBROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

# Copy publishable files
cp -a "$SRC_DIR"/. "$WEBROOT"/

# Ensure .htaccess exists for cPanel/Apache
if [ ! -f "$WEBROOT/.htaccess" ]; then
cat > "$WEBROOT/.htaccess" <<'HTACCESS'
DirectoryIndex index.html
Options -Indexes
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !https
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  RewriteCond %{HTTP_HOST} ^konutta\.com$ [NC]
  RewriteRule ^ https://www.konutta.com%{REQUEST_URI} [L,R=301]
</IfModule>
ErrorDocument 404 /index.html
HTACCESS
fi

# Permissions
find "$WEBROOT" -type d -exec chmod 755 {} + || true
find "$WEBROOT" -type f -exec chmod 644 {} + || true

printf '\nKurulum tamamlandı. Ana dosyalar:\n'
ls -la "$WEBROOT" | sed -n '1,40p'

printf '\nKontrol:\n'
[ -f "$WEBROOT/index.html" ] && echo "OK index.html" || { echo "MISSING index.html"; exit 1; }
[ -f "$WEBROOT/ilanlar.html" ] && echo "OK ilanlar.html" || { echo "MISSING ilanlar.html"; exit 1; }
[ -f "$WEBROOT/guven-merkezi.html" ] && echo "OK guven-merkezi.html" || { echo "MISSING guven-merkezi.html"; exit 1; }
[ -f "$WEBROOT/panel.html" ] && echo "OK panel.html" || { echo "MISSING panel.html"; exit 1; }

echo "DONE: Konutta.com dosyaları $WEBROOT içine kuruldu."
