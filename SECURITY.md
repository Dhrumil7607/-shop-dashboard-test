# 🔐 ShopLive Bharat - Security Guidelines

**Version:** 1.0  
**Last Updated:** June 29, 2026  
**Status:** Active

---

## 📋 Security Checklist

### Frontend Security
- [x] Use environment variables for sensitive config
- [x] Sanitize logs (hide passwords, tokens, keys)
- [x] Validate user input on client and server
- [x] Use HTTPS/TLS for all communications
- [x] Implement rate limiting for auth endpoints
- [x] Store tokens in sessionStorage (not localStorage for sensitive ops)
- [x] Implement CSRF protection
- [x] Secure HTTP headers (CSP, X-Frame-Options, etc.)

### Backend Security
- [ ] Use strong password hashing (bcrypt)
- [ ] Implement JWT token validation
- [ ] Rate limiting on authentication endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] Input validation and sanitization
- [ ] Secure API key management
- [ ] CORS properly configured
- [ ] Error handling (don't expose internal details)

---

## 🔑 Environment Variables

### Required Variables
```bash
# .env (NEVER commit to git)
REACT_APP_BACKEND_URL=https://api.shoplivebharat.com
REACT_APP_ENVIRONMENT=production
```

### Example for Development
```bash
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
```

### Example for Production
```bash
REACT_APP_BACKEND_URL=https://api.shoplivebharat.com
REACT_APP_ENVIRONMENT=production
```

---

## 🚫 What NOT to Do

### ❌ Hardcoding Secrets
```javascript
// DON'T DO THIS
const apiKey = "sk_live_51234567890abcdefghijk";
const adminSecret = "admin_super_secret_key";

// ✅ DO THIS INSTEAD
const apiKey = process.env.REACT_APP_API_KEY;
const adminSecret = process.env.REACT_APP_ADMIN_SECRET;
```

### ❌ Logging Sensitive Data
```javascript
// DON'T DO THIS
console.log("User data:", user); // Might contain passwords
console.log("Auth token:", token);
console.log("Admin key:", adminKey);

// ✅ DO THIS INSTEAD
import { secureLog } from "@/lib/secureConfig";
secureLog.info("User authenticated:", { id: user.id, email: user.email });
```

### ❌ Exposing Error Details
```javascript
// DON'T DO THIS
catch (error) {
    console.error("Database error:", error.message); // Exposes table names, SQL
    toast.error(error.message);
}

// ✅ DO THIS INSTEAD
import { secureLog } from "@/lib/secureConfig";
catch (error) {
    secureLog.error("Database error", error);
    toast.error(secureLog.userError(error));
}
```

### ❌ Storing Tokens in localStorage for Sensitive Operations
```javascript
// DON'T DO THIS for admin operations
localStorage.setItem("admin_token", token); // Vulnerable to XSS

// ✅ DO THIS INSTEAD
sessionStorage.setItem("admin_token", token); // Clears on browser close
```

### ❌ Committing .env Files
```bash
# DON'T
git add .env
git commit -m "Add env vars"

# ✅ DO
echo ".env" >> .gitignore
git add .gitignore
```

---

## ✅ Security Best Practices

### 1. Environment Variables

**Setup:**
```bash
# Create .env from template
cp .env.example .env

# Edit .env with actual values (NEVER commit)
# Add to .gitignore
echo ".env" >> .gitignore
```

**Usage:**
```javascript
import { config } from "@/lib/secureConfig";

const backendUrl = config.backend.url; // Safe
```

### 2. Secure Logging

**Safe Logging:**
```javascript
import { secureLog } from "@/lib/secureConfig";

// Safe - sensitive fields are redacted
secureLog.info("User login", user); // Output: { id: "123", email: "[REDACTED]" }

// User-friendly error messages
try {
    await api.post("/auth/login", { email, password });
} catch (error) {
    toast.error(secureLog.userError(error)); // Never exposes internal details
}
```

### 3. Authentication Security

**Login with Rate Limiting:**
```javascript
const [attempts, setAttempts] = useState(0);
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

const handleLogin = async () => {
    if (attempts >= MAX_ATTEMPTS) {
        toast.error("Account temporarily locked. Try again later.");
        return;
    }

    try {
        await loginUser(email, password);
        setAttempts(0); // Reset on success
    } catch (error) {
        setAttempts((prev) => prev + 1);
        toast.error("Login failed");
    }
};
```

### 4. API Security

**Safe API Calls:**
```javascript
import { api, secureLog } from "@/lib/api";

// ✅ Using secure API instance
export async function loginUser(email, password) {
    try {
        const { data } = await api.post("/auth/login", { 
            email, 
            password 
        });
        
        // Store token securely
        sessionStorage.setItem("slb_token", data.token);
        
        secureLog.info("User logged in successfully");
        return data;
    } catch (error) {
        // Never expose server errors
        secureLog.error("Login failed", error);
        throw new Error(secureLog.userError(error));
    }
}
```

### 5. Input Validation

**Validate on Client AND Server:**
```javascript
export function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
    // Minimum 8 characters, 1 uppercase, 1 number, 1 special char
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
}

export function validatePhone(phone) {
    return /^[\d\s\-\+\(\)]{10,}$/.test(phone.replace(/\D/g, ""));
}
```

### 6. Secure Token Management

**Token Storage Strategy:**
```javascript
// For regular user operations
localStorage.setItem("slb_token", token);

// For admin operations (more sensitive)
sessionStorage.setItem("slb_admin_session", token);

// Clear on logout
localStorage.removeItem("slb_token");
sessionStorage.removeItem("slb_admin_session");

// Clear on page close
window.addEventListener("beforeunload", () => {
    sessionStorage.clear(); // Auto-clears on browser close
});
```

### 7. Password Handling

**Client-side (Optional additional layer):**
```javascript
import { hashPassword } from "@/lib/secureConfig";

const handleLogin = async (password) => {
    // Client-side hash (backend must still hash)
    // const hashedPassword = await hashPassword(password);
    
    // Backend validation handles the real security
    await loginUser(email, password);
};
```

**Server-side (CRITICAL):**
```python
# backend/auth.py
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

---

## 🔍 Code Review Checklist

Before committing code, verify:

### Secrets & Configuration
- [ ] No hardcoded API keys
- [ ] No hardcoded passwords
- [ ] No hardcoded admin credentials
- [ ] No .env files in git
- [ ] All secrets use environment variables

### Logging
- [ ] No sensitive data logged
- [ ] Using `secureLog` for sensitive operations
- [ ] Error messages are user-friendly (not technical)
- [ ] No token/password in console.log

### API Calls
- [ ] Using HTTPS/TLS in production
- [ ] Proper error handling
- [ ] No sensitive data in URL params (use POST body)
- [ ] Input validation before sending

### Authentication
- [ ] Tokens stored securely (sessionStorage for sensitive)
- [ ] Rate limiting implemented
- [ ] Password strength validation
- [ ] Logout clears all tokens

### User Data
- [ ] Only necessary fields exposed to frontend
- [ ] Sensitive fields (phone, SSN) never logged
- [ ] PII masked in UI (show only last 4 digits, etc.)

---

## 🚨 Incident Response

### If a Secret is Exposed

1. **Immediately Revoke** the secret (rotate API keys, etc.)
2. **Audit Logs** to check if it was used
3. **Notify Users** if their data might be affected
4. **Update Environment** with new secret
5. **Document** what happened and how to prevent it

### If a User Account is Compromised

1. **Force Password Reset**
2. **Clear Sessions** (invalidate all tokens)
3. **Notify User** of suspicious activity
4. **Enable 2FA** if available
5. **Monitor** for further unauthorized access

---

## 📞 Security Resources

### Tools
- **Password Hasher:** https://bcrypt-generator.com/ (for testing only)
- **SSL/TLS Checker:** https://www.ssllabs.com/ssltest/
- **Security Scanner:** https://owasp.org/www-project-zap/
- **Dependency Audit:** `npm audit`

### Documentation
- [OWASP Top 10](https://owasp.org/Top10/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

### Team Guidelines
- All code changes must pass security review
- Security team has final approval on auth/payments
- Incident response plan documented
- Regular security audits scheduled

---

## 🔐 API Security Headers

**Recommended headers in production:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-29 | Initial security guidelines |

---

**Last Review:** June 29, 2026  
**Next Review:** After first production deployment  
**Status:** ✅ Active

**Questions?** Contact security team or review BRAIN.md for architecture details.
