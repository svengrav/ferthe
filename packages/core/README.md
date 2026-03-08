## Deployment Core

Setup nginx to forward requests to the web server:
``server {
    listen 80;
    server_name foxhole.ferthe.de;

    location / {
        proxy_pass http://localhost:7000/;  # PORT mit dem echten Port ersetzen
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
``
Setup Cloudflare to forward requests to nginx:
``sudo bash ./devbox/cloudflare/add-route.bash foxhole.ferthe.de http://localhost:7000``
- /etc/cloudflared/config.yml 