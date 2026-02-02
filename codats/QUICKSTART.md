# CODATS Quick Start Guide

## 🚀 Get Started in 30 Seconds

### Option 1: Install from VSIX (Recommended for End Users)

```bash
# 1. Download the .vsix file
cd d:\Project\CODATS\codats

# 2. In VS Code:
#    Extensions (Ctrl+Shift+X)
#    → ... menu
#    → "Install from VSIX..."
#    → Select codats-1.0.0.vsix

# 3. Done! Restart VS Code
# 4. Open any .js, .ts, .py, or .java file to see CODATS in action
```

### Option 2: Development Mode (For Developers)

```bash
# 1. Install dependencies
cd d:\Project\CODATS\codats
npm install

# 2. Start development mode
npm run watch

# 3. In VS Code, press F5
# 4. This opens Extension Development Host with CODATS active

# 5. Open test-vulnerable.js or test-vulnerable.py to see issues
```

---

## 📝 Using CODATS

### Automatic Scanning

- **On File Open** ✅ - CODATS scans automatically
- **On File Save** ✅ - Rescans when you save
- **On File Edit** ✅ - Real-time scanning as you type

### Commands (Ctrl+Shift+P)

```
CODATS: Scan Current File      - Scan active editor
CODATS: Scan All Files          - Scan entire workspace
CODATS: Clear All Diagnostics   - Remove all detected issues
```

### Quick Fixes

1. Click on a red underline (vulnerability)
2. Press `Ctrl+.` (or click the lightbulb)
3. Select "Apply secure fix for [rule-id]"
4. Code is fixed automatically
5. File is re-scanned

### View Details

1. **Hover** over a red line to see:
   - Vulnerability ID
   - Severity level
   - Message & explanation
   - Suggested fix

2. **Check Problems Panel** (Ctrl+Shift+M):
   - All detected issues
   - Severity color-coded
   - Click to jump to issue

---

## 🧪 Test Files Included

Two sample files with intentional vulnerabilities:

### test-vulnerable.js

Contains 10 JavaScript vulnerabilities:

- eval() usage
- Hardcoded API keys
- SQL injection
- XSS (innerHTML)
- Weak cryptography
- Command injection
- Disabled SSL verification
- Missing authentication
- Default credentials
- Insecure randomness

### test-vulnerable.py

Contains 10 Python vulnerabilities:

- eval() and exec()
- Hardcoded secrets
- Pickle deserialization
- MD5 hashing
- Command injection
- Insecure random
- SQL injection
- Default credentials
- Hardcoded credentials

**Try it:**

```bash
# Open either test file in VS Code
# CODATS will immediately detect all vulnerabilities
# Red underlines appear on vulnerable lines
# Use Ctrl+. to apply quick fixes
```

---

## 🎯 What CODATS Detects

### High Severity (🛑 Red)

- eval(), exec() usage
- SQL/Command/NoSQL injection
- Hardcoded credentials & API keys
- XSS vulnerabilities
- Unsafe deserialization
- Disabled SSL/TLS
- Weak cryptography (MD5, SHA-1)

### Medium Severity (⚠️ Orange)

- Insecure randomness
- Missing authentication
- Unvalidated redirects
- Missing CSRF protection
- XML External Entities (XXE)
- Sensitive data logging

### Low Severity (ℹ️ Blue)

- Hardcoded IP addresses
- Missing security headers

---

## 🔒 Security Features

✅ **100% Local Analysis** - No code sent anywhere  
✅ **Offline Operation** - Works without internet  
✅ **No Auto-Modify** - You approve all changes  
✅ **Read-Only Scanning** - Never modifies without consent  
✅ **Comment-Aware** - Ignores code in comments  
✅ **Smart Fixes** - Context-aware suggestions

---

## 📊 Supported Languages

| Language   | Extension | Support |
| ---------- | --------- | ------- |
| JavaScript | .js       | ✅ Full |
| TypeScript | .ts       | ✅ Full |
| Python     | .py       | ✅ Full |
| Java       | .java     | ✅ Full |

---

## 🛠️ Troubleshooting

### Issue: CODATS not detecting issues

**Solution**:

1. Make sure file is supported (.js, .ts, .py, .java)
2. Reload window (Ctrl+R in Extension Dev Host)
3. Check if vulnerabilities match the rules

### Issue: Quick fix not working

**Solution**:

1. Click on the red underline
2. Press Ctrl+. (or use Command Palette)
3. Select the fix action
4. Review and save

### Issue: Performance is slow

**Solution**:

1. CODATS debounces (1000ms on type, 500ms on save)
2. For very large files (10k+ lines), might be slower
3. Close unused editors to improve performance

### Issue: Extension won't activate

**Solution**:

1. Make sure you have a .js, .ts, .py, or .java file open
2. Restart VS Code
3. Check output for errors (View > Output)

---

## 📚 Learn More

- [Full README](README.md) - Complete feature documentation
- [Development Guide](DEVELOPMENT.md) - For developers
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Technical details

---

## 🎓 Using in Training/Interview

Perfect for demonstrating:

- **Security knowledge** - Shows OWASP awareness
- **Code analysis skills** - Pattern detection & fixes
- **VS Code expertise** - Extension development
- **Clean architecture** - Well-organized codebase

**Demo Steps:**

1. Open test-vulnerable.js in Extension Dev Host
2. Show automatic issue detection
3. Hover to explain vulnerabilities
4. Apply a quick fix with Ctrl+.
5. Discuss why the fix is secure

---

## 🚀 Advanced Usage

### Scan Entire Project

```
Command Palette → CODATS: Scan All Files in Workspace
```

### Clear All Issues

```
Command Palette → CODATS: Clear All Diagnostics
```

### View All Issues

```
Ctrl+Shift+M → Opens Problems Panel with all detected issues
```

### Customize Severity Display

Check VS Code settings for:

- Error lens
- Inline diagnostics
- Problem panel filtering

---

## 📦 What's Included

✅ 40+ vulnerability detection rules  
✅ Real-time analysis engine  
✅ Quick fix code actions  
✅ Hover information tooltips  
✅ Multi-language support  
✅ Professional UI integration  
✅ Comprehensive documentation  
✅ Test files with examples  
✅ Ready-to-share VSIX package

---

## 💡 Pro Tips

1. **Use with other linters** - CODATS complements ESLint, Pylint, etc.
2. **Check Problems panel** - Best view of all issues in your project
3. **Apply fixes carefully** - Always review auto-generated fixes
4. **Combine languages** - Works across JS, Python, Java in same project
5. **Share with team** - Just share the .vsix file

---

## 🎯 Common Vulnerabilities Explained

### 1. eval() - Why It's Dangerous

```javascript
// ❌ DANGEROUS
eval(userInput); // Can execute ANY JavaScript!

// ✅ SAFE
JSON.parse(userInput); // Only parses JSON safely
```

### 2. Hardcoded Credentials

```python
# ❌ DANGEROUS - Anyone can see this in GitHub
API_KEY = "sk-abc123xyz789"

# ✅ SAFE - Credentials in environment
API_KEY = os.getenv("API_KEY")
```

### 3. SQL Injection

```javascript
// ❌ DANGEROUS - Attacker can modify query
query = "SELECT * FROM users WHERE id = " + userId;

// ✅ SAFE - Attacker data stays in parameter
query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);
```

### 4. XSS Attack

```javascript
// ❌ DANGEROUS - User HTML injected
elem.innerHTML = userInput;

// ✅ SAFE - Text only, no HTML injection
elem.textContent = userInput;
```

### 5. Weak Cryptography

```python
# ❌ WEAK - MD5 can be cracked
hash = hashlib.md5(password).digest()

# ✅ STRONG - SHA-256 is secure
hash = hashlib.sha256(password).digest()
```

---

## 📞 Support

- **Questions?** Check DEVELOPMENT.md for technical details
- **Bug Reports?** File an issue on GitHub
- **Feature Requests?** Discuss in GitHub Issues
- **Security Issues?** Email security@codats.dev

---

## 🎉 You're Ready!

```bash
# Installation complete!
# CODATS is now analyzing your code for security vulnerabilities
# Open any supported file to see it in action

Happy secure coding! 🛡️
```

---

**Version: 1.0.0** | **License: MIT** | **Status: Ready to Use**
