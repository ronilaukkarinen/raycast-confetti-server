
# 🎉 Raycast Confetti Webhook Server

This project sets up a webhook server that triggers Raycast's confetti effect when certain events occur in Todoist, Pipedrive, and Height.app. Using this setup, confetti will appear in Raycast whenever:

- A task is completed in Todoist
- A deal is marked as "won" in Pipedrive
- A task is completed in Height.app

## Requirements

- A remote SSH server
- macOS with [raycast-confetti-receiver](https://github.com/ronilaukkarinen/raycast-confetti-receiver) set up
- **Node.js** (v12+)
- **Todoist API Token**
- **Pipedrive API Access**
- **Height.app API Access**

## Setup instructions

### Clone the repository

Clone the repository to your server or local machine:

```bash
git clone https://github.com/ronilaukkarinen/raycast-confetti-server.git
cd raycast-confetti-server
```

### Install dependencies

Install the necessary Node.js packages:

```bash
npm install
```

### Configure the server script

Update the `webhook-server.mjs` file (or `webhook-server.js` if using `"type": "module"` in `package.json`) to ensure it is listening on the correct port.

### Configure `systemd` for automatic startup

1. Create a `systemd` service file at `/etc/systemd/system/raycast-confetti.service`:

   ```ini
   [Unit]
   Description=Webhook Server for Todoist, Pipedrive, and Height.app
   After=network.target

   [Service]
   ExecStart=/usr/bin/node /path/to/your/project/webhook-server.mjs
   WorkingDirectory=/path/to/your/project
   Restart=always
   User=your_username
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

   Replace `/path/to/your/project` and `your_username` with your actual project directory and username.

2. Reload `systemd`, start the service, and enable it to run on startup:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start webhook-server
   sudo systemctl enable webhook-server
   ```

3. Check the service status:

   ```bash
   sudo systemctl status webhook-server
   ```

### Watch the server output log

To watch the server output log, run:

```bash
sudo journalctl -u webhook-server -f
```

### Configure nginx as a reverse proxy

If you want to use a domain name with your webhook server, you can set up an nginx reverse proxy.

Add to `/etc/nginx/sites-enabled/your-domain`:

```nginx
server {
    listen 443 ssl http2;

    server_name raycast-webhooks.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/raycast-webhooks.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/raycast-webhooks.yourdomain.com/privkey.pem;

    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;
    ssl_dhparam /etc/ssl/certs/dhparam.pem;
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;
    add_header Strict-Transport-Security max-age=15768000;

    location /.well-known {
        alias /var/www/raycast-webhooks.yourdomain.com/public_html/.well-known;
    }

    location /.well-known/ {
       root /var/www/raycast-webhooks.yourdomain.com/public_html;
    }

    location / {
      proxy_pass http://127.0.0.1:5462;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "Upgrade";
      proxy_set_header Host $http_host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $remote_addr;
      proxy_set_header X-Forwarded-Port $server_port;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name raycast-webhooks.yourdomain.com;

    location ~ /.well-known {
       allow all;
       root /var/www/raycast-webhooks.yourdomain.com/public_html;
    }

    location ~ /\.well-known/acme-challenge {
        allow all;
        root /var/www/raycast-webhooks.yourdomain.com/public_html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

map $http_upgrade $connection_upgrade {
    default upgrade;
    ''	close;
}
```

Add a cert, test the config and restart nginx.

### Set up webhooks

Each application requires specific settings to trigger the webhook server correctly.

#### Todoist Webhook

Use the following `curl` command to create a webhook in Todoist for task completions:

```bash
curl -X POST https://api.todoist.com/sync/v9/webhook -H "Authorization: Bearer YOUR_TODOIST_API_TOKEN" -d "url=http://raycast-webhooks.yourdomain.com/todoist-webhook" -d "event_name=task:completed"
```

#### Pipedrive Webhook

1. Log into your **Pipedrive** account.
2. Go to **Tools and Apps > Webhooks**.
3. Create a new webhook:
   - **URL**: `http://raycast-webhooks.yourdomain.com/pipedrive-webhook`
   - **Event Action**: `updated`
   - **Object**: `deal`
4. Save the webhook.

#### Height.app Webhook

1. Log into your **Height.app** account.
2. Go to **Settings > Integrations > Webhooks**.
3. Create a new webhook:
   - **URL**: `http://raycast-webhooks.yourdomain.com/height-webhook`
   - **Event Type**: `task.updated`
4. Save the webhook.

### Testing the Webhooks

Once the webhooks are set up, you can test them by:

- Completing a task in Todoist
- Marking a deal as "won" in Pipedrive
- Completing a task in Height.app

Check the server logs to confirm that each webhook triggers the appropriate confetti action.

### License

This project is licensed under the MIT License.
