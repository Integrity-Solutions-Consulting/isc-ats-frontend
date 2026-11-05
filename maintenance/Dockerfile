FROM nginx:stable-alpine

COPY maintenance/nginx.conf /etc/nginx/conf.d/default.conf
COPY maintenance/index.html /usr/share/nginx/html/maintenance.html
COPY public/brand/logo_integrity_full.svg /usr/share/nginx/html/brand/logo_integrity_full.svg

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
