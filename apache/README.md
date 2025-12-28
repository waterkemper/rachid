# Apache Reverse Proxy Configuration

This directory contains Apache virtual host configurations for proxying requests to the Docker containers.

## Files

- `orachid-frontend.conf`: Virtual host for frontend (orachid.com.br)
- `orachid-api.conf`: Virtual host for API (api.orachid.com.br)

## Setup Instructions

### 1. Install Required Apache Modules

#### Amazon Linux 2 / CentOS / RHEL

Edit `/etc/httpd/conf/httpd.conf` and uncomment these lines:
```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule headers_module modules/mod_headers.so
LoadModule ssl_module modules/mod_ssl.so
```

Or use sed to uncomment them automatically:
```bash
sudo sed -i 's/#LoadModule proxy_module/LoadModule proxy_module/' /etc/httpd/conf/httpd.conf
sudo sed -i 's/#LoadModule proxy_http_module/LoadModule proxy_http_module/' /etc/httpd/conf/httpd.conf
sudo sed -i 's/#LoadModule headers_module/LoadModule headers_module/' /etc/httpd/conf/httpd.conf
sudo sed -i 's/#LoadModule ssl_module/LoadModule ssl_module/' /etc/httpd/conf/httpd.conf
```

#### Ubuntu/Debian

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod ssl
```

### 2. Copy Configuration Files

#### Amazon Linux 2 / CentOS / RHEL

```bash
sudo cp orachid-frontend.conf /etc/httpd/conf.d/
sudo cp orachid-api.conf /etc/httpd/conf.d/
```

#### Ubuntu/Debian

```bash
sudo cp orachid-frontend.conf /etc/apache2/sites-available/
sudo cp orachid-api.conf /etc/apache2/sites-available/
sudo a2ensite orachid-frontend.conf
sudo a2ensite orachid-api.conf
```

### 3. Test Configuration

#### Amazon Linux 2 / CentOS / RHEL

```bash
sudo httpd -t
```

#### Ubuntu/Debian

```bash
sudo apache2ctl configtest
```

### 4. Restart Apache

#### Amazon Linux 2 / CentOS / RHEL

```bash
sudo systemctl restart httpd
sudo systemctl enable httpd  # Enable on boot
```

#### Ubuntu/Debian

```bash
sudo systemctl restart apache2
```

## Port Configuration

- **Frontend**: Docker container exposes port 8080 (host) → Apache proxies to `http://localhost:8080`
- **Backend**: Docker container exposes port 3001 (host) → Apache proxies to `http://localhost:3001`
- **Apache**: Listens on ports 80 (HTTP) and 443 (HTTPS)

## SSL/TLS Setup (Let's Encrypt)

After setting up SSL certificates with Certbot, uncomment the SSL configuration sections in both files:

1. Uncomment `SSLEngine on`
2. Uncomment `SSLCertificateFile` and `SSLCertificateKeyFile` lines
3. Update certificate paths if needed
4. Restart Apache

```bash
# Get certificates
sudo certbot --apache -d orachid.com.br -d www.orachid.com.br
sudo certbot --apache -d api.orachid.com.br
```

## Troubleshooting

### Check Apache Status

#### Amazon Linux 2 / CentOS / RHEL

```bash
sudo systemctl status httpd
```

#### Ubuntu/Debian

```bash
sudo systemctl status apache2
```

### View Error Logs

#### Amazon Linux 2 / CentOS / RHEL

```bash
sudo tail -f /var/log/httpd/error_log
sudo tail -f /var/log/httpd/orachid-frontend-error.log
sudo tail -f /var/log/httpd/orachid-api-error.log
```

#### Ubuntu/Debian

```bash
sudo tail -f /var/log/apache2/error.log
sudo tail -f /var/log/apache2/orachid-frontend-error.log
sudo tail -f /var/log/apache2/orachid-api-error.log
```

### Test Proxy Manually

```bash
# Test frontend proxy
curl -H "Host: orachid.com.br" http://localhost/

# Test API proxy
curl -H "Host: api.orachid.com.br" http://localhost/api/health
```

### Common Issues

1. **502 Bad Gateway**: Docker containers not running
   - Check: `docker-compose ps`
   - Start: `docker-compose up -d`

2. **503 Service Unavailable**: Containers not healthy
   - Check: `docker-compose logs`
   - Check health: `curl http://localhost:8080/health` and `curl http://localhost:3001/health`

3. **Connection Refused**: Wrong port in ProxyPass
   - Verify frontend is on port 8080
   - Verify backend is on port 3001

4. **Module not loaded**: Apache modules not enabled
   - Check: `httpd -M | grep proxy` (Amazon Linux 2/CentOS/RHEL)
   - Check: `apache2ctl -M | grep proxy` (Ubuntu/Debian)
   - If not found, uncomment the LoadModule lines in `/etc/httpd/conf/httpd.conf`

## Security Considerations

1. **Firewall**: Only open ports 80 and 443 to public
2. **SSL**: Always use HTTPS in production
3. **Headers**: Security headers are configured in nginx (frontend), but you can add more in Apache
4. **Rate Limiting**: Consider adding rate limiting modules for API protection

