# Cloudflare Optimization Guide for CoSheet

Hướng dẫn cấu hình Cloudflare để tối ưu caching, CDN, và performance cho dulieu.truyenthong.edu.vn

---

## 1. DNS Setup ✅

**Đã hoàn thành:** Domain `dulieu.truyenthong.edu.vn` đã được thêm vào Cloudflare

**DNS Records:**
```
A     dulieu.truyenthong.edu.vn    192.168.1.223    Proxied (Orange cloud)
AAAA  dulieu.truyenthong.edu.vn    <IPv6 nếu có>     Proxied
```

---

## 2. SSL/TLS Configuration

### Recommended Settings:
- **SSL/TLS encryption mode:** Full (strict) hoặc Flexible
- **Always Use HTTPS:** ON
- **Automatic HTTPS Rewrites:** ON
- **Minimum TLS Version:** TLS 1.2
- **TLS 1.3:** Enabled

### Steps:
1. Go to **SSL/TLS** tab
2. Set encryption mode to **Full (strict)** (nếu có SSL cert trên origin server)
3. Enable **Always Use HTTPS**
4. Enable **HTTP Strict Transport Security (HSTS)**
   - Max Age: 6 months (15768000)
   - Include subdomains: YES
   - Preload: YES

---

## 3. Caching Configuration ⚡

### Page Rules (Create 3 rules):

#### Rule 1: Static Assets - Aggressive Caching
```
URL Pattern: dulieu.truyenthong.edu.vn/static/*

Settings:
  ✅ Cache Level: Cache Everything
  ✅ Edge Cache TTL: 1 month
  ✅ Browser Cache TTL: 1 year
```

#### Rule 2: Images - Long-term Caching
```
URL Pattern: dulieu.truyenthong.edu.vn/images/*

Settings:
  ✅ Cache Level: Cache Everything
  ✅ Edge Cache TTL: 1 month
  ✅ Browser Cache TTL: 1 month
```

#### Rule 3: Dynamic Content - Bypass Cache
```
URL Pattern: dulieu.truyenthong.edu.vn/_*

Settings:
  ✅ Cache Level: Bypass
  ⚠️ Reason: State-changing operations (new, save, upload)
```

### Caching Settings (Global):
Go to **Caching** > **Configuration**
- **Caching Level:** Standard
- **Browser Cache TTL:** Respect Existing Headers
- **Crawler Hints:** ON
- **Always Online:** ON (serve stale content if origin down)

---

## 4. Speed Optimizations 🚀

### Auto Minify:
Go to **Speed** > **Optimization**
- [x] JavaScript
- [x] CSS
- [x] HTML

### Brotli Compression:
- [x] Enable Brotli (better than gzip, ~15% smaller files)

### Rocket Loader:
- [ ] OFF (có thể gây conflict với SocialCalc dynamic loading)

### Mirage (Image Optimization):
- [x] ON (lazy load images, serve WebP when supported)

### Polish (Lossy/Lossless):
- [x] Lossy (giảm 30-50% image size without visible quality loss)
- [x] WebP conversion

### Early Hints:
- [x] ON (send HTTP 103 responses để browser preload resources)

---

## 5. Performance Settings

### HTTP/3 (QUIC):
- [x] Enabled (faster than HTTP/2, especially on mobile)

### 0-RTT Connection Resumption:
- [x] ON (faster HTTPS handshake for returning visitors)

### Argo Smart Routing (Paid feature):
- [ ] Optional: $5/month + $0.10/GB
- Benefit: Route traffic through less congested Cloudflare network paths
- Expected: 30% faster origin response time

### Load Balancing (Enterprise):
- [ ] Not needed for single-server setup
- Future: Add when scaling to multiple servers

---

## 6. Firewall & Security 🔒

### Firewall Rules:

#### Rule 1: Block Bad Bots
```
Expression: (cf.client.bot)
Action: Challenge (CAPTCHA)
```

#### Rule 2: Rate Limiting (Cloudflare Rate Limiting - Paid)
```
Rule: More than 100 requests/10 seconds from same IP
Action: Block for 1 hour
```

**Free Alternative:** Use nginx rate limiting (đã implement trong nginx config)

### Security Level:
- **Setting:** Medium (default)
- **Bot Fight Mode:** ON (free tier)

### Challenge Passage:
- **Duration:** 30 minutes

---

## 7. Network Settings

### WebSockets:
- [x] Enabled (required for real-time collaboration)

### HTTP/2 to Origin:
- [x] ON (faster backend connections)

### IPv6 Compatibility:
- [x] ON

### Pseudo IPv4:
- [ ] OFF (not needed)

---

## 8. Workers (Optional - Advanced) 🛠️

Nếu cần edge computing, có thể dùng Cloudflare Workers:

### Use case 1: Edge Caching with Custom Logic
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Cache static assets
  if (url.pathname.startsWith('/static/')) {
    const cache = caches.default
    let response = await cache.match(request)
    
    if (!response) {
      response = await fetch(request)
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      })
      
      event.waitUntil(cache.put(request, response.clone()))
    }
    
    return response
  }
  
  // Bypass cache for API calls
  if (url.pathname.startsWith('/_')) {
    return fetch(request)
  }
  
  return fetch(request)
}
```

### Use case 2: A/B Testing
```javascript
// Serve different versions to different users
```

**Cost:** $5/month for 10M requests + $0.50/million additional

---

## 9. Analytics & Monitoring 📊

### Cloudflare Analytics:
- Check: **Analytics** > **Traffic**
- Metrics:
  - Requests per second
  - Bandwidth usage
  - Cache ratio (target: >80%)
  - Response time (target: <100ms from edge)

### Web Analytics (Privacy-friendly):
- [x] Enable Cloudflare Web Analytics
- Benefits: No cookies, GDPR compliant
- Metrics: Page views, bounce rate, visit duration

---

## 10. Mobile Optimization 📱

### AMP (Accelerated Mobile Pages):
- [ ] Not applicable (SocialCalc is interactive app, not static content)

### Mirage (Image Lazy Loading):
- [x] ON

### Rocket Loader:
- [ ] OFF (as mentioned, conflicts with dynamic JS)

---

## 11. Recommended Cloudflare Plan

### Free Tier (Current):
✅ Unlimited bandwidth  
✅ Basic DDoS protection  
✅ SSL certificate  
✅ CDN (all locations)  
✅ 3 Page Rules  
❌ Argo Smart Routing  
❌ Advanced Rate Limiting  
❌ Workers (limited to 100k requests/day)

### Pro Tier ($20/month) - Recommended for production:
✅ All Free features  
✅ Image optimization (Polish, Mirage)  
✅ 20 Page Rules  
✅ WAF (Web Application Firewall)  
✅ Prioritized email support  
⚠️ Consider nếu có >10k visitors/day

### Business Tier ($200/month):
✅ All Pro features  
✅ 50 Page Rules  
✅ Custom SSL certificates  
✅ 100% uptime SLA  
✅ 24/7 phone support  
⚠️ Overkill for education use case

---

## 12. Testing & Validation ✅

### After configuring Cloudflare:

#### 1. Check DNS propagation:
```bash
dig dulieu.truyenthong.edu.vn
# Should show Cloudflare IPs (104.x.x.x range)
```

#### 2. Test caching:
```bash
curl -I https://dulieu.truyenthong.edu.vn/static/ethercalc.js
# Look for: cf-cache-status: HIT (after first request)
```

#### 3. Test speed:
- **WebPageTest:** https://www.webpagetest.org/
- **GTmetrix:** https://gtmetrix.com/
- **Pingdom:** https://tools.pingdom.com/

Target metrics:
- TTFB: <200ms
- Fully Loaded: <3s
- Performance Score: >90

#### 4. Test WebSocket:
```javascript
// In browser console:
const ws = new WebSocket('wss://dulieu.truyenthong.edu.vn/socket.io/');
ws.onopen = () => console.log('WebSocket connected!');
```

#### 5. Security headers check:
- https://securityheaders.com/?q=dulieu.truyenthong.edu.vn
- Target: A+ rating

---

## 13. Monitoring & Alerts

### Setup Email Alerts:
Go to **Notifications** > **Add**

Recommended alerts:
- [ ] Origin Error Rate Increased
- [ ] Traffic Anomalies Detected
- [ ] SSL Certificate Expiring Soon
- [ ] DDoS Attack Detected

---

## 14. Troubleshooting

### Issue: "Too many redirects" error
**Fix:** Change SSL/TLS mode from "Flexible" to "Full"

### Issue: WebSocket connection fails
**Fix:** Ensure WebSockets are enabled in Cloudflare Network settings

### Issue: Cache not working
**Debug:**
```bash
curl -I https://dulieu.truyenthong.edu.vn/static/test.js
# Check cf-cache-status header
# Possible values: HIT, MISS, EXPIRED, BYPASS, DYNAMIC
```

### Issue: 520/521/522 errors
**Meaning:** Origin server down or unreachable  
**Fix:** Check nginx/CoSheet service status

---

## 15. Performance Gains Expected 🎉

After Cloudflare optimization:

| Metric | Before Cloudflare | After Cloudflare | Improvement |
|--------|-------------------|------------------|-------------|
| **TTFB** | 300-500ms | <100ms | 70% faster |
| **Page Load** | 4-6s | <2s | 65% faster |
| **Bandwidth** | Direct to origin | Offloaded to CDN | 80% reduction |
| **Availability** | 99% | 99.9%+ | Always Online cache |
| **Security** | Basic nginx | DDoS + WAF + Bot protection | Enterprise-grade |

---

**Next Steps:**
1. ✅ Verify DNS is proxied (orange cloud)
2. ✅ Configure Page Rules (3 rules above)
3. ✅ Enable Speed optimizations
4. ✅ Set up Analytics & Monitoring
5. ✅ Test with WebPageTest
6. ✅ Monitor for 1 week, adjust TTLs if needed

**Last updated:** December 1, 2025  
**Maintainer:** phucdhh
