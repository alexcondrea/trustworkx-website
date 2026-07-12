# Hetzner server setup — trustworkx website

One-time provisioning for the server that hosts the live site and the staging
preview. Commands assume a Debian/Ubuntu server with root/sudo access.

## Overview

| What | Where |
|---|---|
| Live site | https://www.trustworkx.de/ → `/var/www/live` |
| Staging preview | https://www-staging.trustworkx.de/ → `/var/www/staging` (basic auth) |
| Deploys | GitHub Actions rsyncs over SSH as the `deploy` user |

## 1. Deploy user and directories

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /var/www/live /var/www/staging
sudo chown -R deploy:deploy /var/www/live /var/www/staging

# SSH key for GitHub Actions (generate locally, NOT on the server):
#   ssh-keygen -t ed25519 -f deploy_key -N "" -C "github-actions-deploy"
# Public half goes to the server:
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy sh -c 'cat >> /home/deploy/.ssh/authorized_keys'   # paste deploy_key.pub
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

The private half (`deploy_key`) goes into the GitHub repo secret
`DEPLOY_SSH_KEY`, then delete it locally. Also set secrets `DEPLOY_HOST`
(server IP or hostname) and `DEPLOY_USER` (`deploy`).

## 2. nginx

```bash
sudo apt update && sudo apt install -y nginx apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd_staging marketing   # choose the shared password
```

`/etc/nginx/sites-available/trustworkx`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name www.trustworkx.de;

    root /var/www/live;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name www-staging.trustworkx.de;

    root /var/www/staging;
    index index.html;

    auth_basic "TrustworkX Preview";
    auth_basic_user_file /etc/nginx/.htpasswd_staging;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/trustworkx /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 3. DNS

At the DNS provider for trustworkx.de:

- `www` → A/AAAA record pointing at this server (if not already)
- `www-staging` → A/AAAA record pointing at this server

Do NOT touch other records (the app on the other server uses them).

## 4. TLS (after DNS resolves)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d www.trustworkx.de -d www-staging.trustworkx.de
```

Certbot rewrites the nginx config for HTTPS and installs auto-renewal.

## 5. Smoke test

```bash
curl -I https://www.trustworkx.de/                 # 200
curl -I https://www-staging.trustworkx.de/          # 401 (auth required)
curl -I -u marketing:PASSWORD https://www-staging.trustworkx.de/   # 200
```
