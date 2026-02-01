# Logs de Produção – Apache / ModSecurity (api.orachid)

Guia para os avisos/erros comuns nos logs do Apache em produção (api.orachid / 52.67.166.19).

---

## 1. ModSecurity: "Host header is a numeric IP address" (920350)

### O que aparece no log

```text
ModSecurity: Warning. Pattern match "^[\\d.:]+$" at REQUEST_HEADERS:Host.
[id "920350"] [msg "Host header is a numeric IP address"] [data "52.67.166.19"]
```

### Causa

Requisições estão chegando com o cabeçalho `Host: 52.67.166.19` (IP do servidor) em vez do domínio (ex.: `api.orachid.com.br`). Isso é comum quando:

- Bots/scanners acessam o servidor pelo IP.
- Alguém usa `https://52.67.166.19/` no browser.
- Health checks ou ferramentas usam o IP.

A regra **920350** do OWASP CRS bloqueia/alertar quando o Host é um IP.

### O que fazer

**Opção A – Deixar como está (recomendado)**  
- É apenas **Warning**; o tráfego normal pelo domínio `api.orachid.com.br` não é afetado.  
- Esses eventos vêm em grande parte de varreduras automáticas. Pode ignorar ou filtrar no log.

**Opção B – Desativar a regra 920350 só para esse VirtualHost**  
Se precisar permitir acesso pelo IP (ex.: health check por IP), crie um arquivo de exceção do ModSecurity no servidor:

```bash
sudo nano /etc/httpd/modsecurity.d/crs-exclusions-orachid.conf
```

Conteúdo (UTF-8):

```apache
# Exclusão OWASP CRS: permitir Host com IP no api.orachid (ex.: health check)
# Só use se realmente precisar aceitar Host por IP.
<LocationMatch "^/">
    SecRuleRemoveById 920350
</LocationMatch>
```

No VirtualHost da API (ou no contexto onde o ModSecurity está ativo), inclua esse arquivo **depois** das regras do CRS, por exemplo em `/etc/httpd/conf.d/orachid-api.conf`:

```apache
IncludeOptional /etc/httpd/modsecurity.d/crs-exclusions-orachid.conf
```

Reinicie o Apache:

```bash
sudo systemctl restart httpd
```

**Opção C – Redirecionar IP para o domínio**  
Manter a regra 920350 e, no Apache, criar um VirtualHost para o IP que redireciona para o domínio (ex.: `https://api.orachid.com.br`). Assim ninguém precisa usar o IP no Host.

---

## 2. SSL: "could not resolve address of OCSP responder r11.o.lencr.org"

### O que aparece no log

```text
(EAI 2)Name or service not known: AH01972: could not resolve address of OCSP responder r11.o.lencr.org
```

### Causa

O Apache está com **OCSP stapling** ativo para o certificado Let's Encrypt, mas o servidor **não consegue resolver** o host `r11.o.lencr.org` (resolvedor DNS do Let's Encrypt para OCSP).  
Isso costuma ocorrer quando:

- DNS do servidor (ex.: `/etc/resolv.conf`) está incorreto ou restrito.
- Firewall/Security Group bloqueia saída DNS (UDP/TCP 53) ou HTTPS para a internet.
- Rede da instância não tem acesso à internet para DNS.

### O que fazer

**Opção A – Desativar OCSP stapling (solução rápida)**  
O HTTPS continua funcionando normalmente sem stapling. No VirtualHost HTTPS da API (no servidor), use:

```apache
SSLUseStapling off
# ou
SSLStapling off
```

(dependendo da versão do Apache: `SSLUseStapling off` em versões mais novas, `SSLStapling off` em outras.)

Exemplo no bloco `<VirtualHost *:443>`:

```apache
SSLEngine on
SSLCertificateFile /etc/letsencrypt/live/api.orachid.com.br/fullchain.pem
SSLCertificateKeyFile /etc/letsencrypt/live/api.orachid.com.br/privkey.pem
SSLUseStapling off
```

Reinicie o Apache após alterar.

**Opção B – Corrigir DNS no servidor (recomendado a longo prazo)**  
Assim o OCSP stapling pode continuar ativo:

1. Verificar resolução no servidor:

   ```bash
   getent hosts r11.o.lencr.org
   # ou
   nslookup r11.o.lencr.org
   ```

2. Se falhar, ajustar DNS (exemplo em Amazon Linux 2):

   ```bash
   sudo nano /etc/resolv.conf
   ```

   Conteúdo típico (usar os DNS que sua rede permite, ex.: AWS ou provedor):

   ```text
   nameserver 8.8.8.8
   nameserver 8.8.4.4
   ```

3. Em EC2, verificar:
   - Security Group: saída (outbound) liberada para DNS (53) e HTTPS (443).
   - VPC: DNS resolution / DNS hostnames habilitados se usar DNS da AWS.

Depois de o servidor resolver `r11.o.lencr.org`, os erros AH01972 tendem a sumir sem precisar desligar o OCSP stapling.

---

## Resumo

| Problema | Severidade | Ação sugerida |
|----------|------------|----------------|
| **920350** – Host é IP | Warning | Ignorar (tráfego por domínio OK) ou desativar 920350 / redirecionar IP→domínio se precisar. |
| **OCSP r11.o.lencr.org** | Erro SSL | `SSLUseStapling off` no VHost HTTPS ou corrigir DNS no servidor. |

Se quiser, posso ajudar a adaptar isso ao seu `orachid-api.conf` real no servidor (caminhos e nomes exatos dos arquivos).
