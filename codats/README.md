# CODATS - AI-Assisted Static Code Security Analyzer

## Overview

**CODATS** (Code Defender and Threat Analyzer Suite) is a VS Code extension that performs **real-time static code security analysis** to detect common vulnerabilities in JavaScript, TypeScript, Python, and Java files. It highlights security issues inline with suggested fixes and provides quick-fix code actions.

## Features

### 🔍 Real-Time Vulnerability Detection

- **Automatic Scanning**: Scans files when opened, saved, or as you type
- **Multi-Language Support**: JavaScript, TypeScript, Python, and Java
- **40+ Vulnerability Rules**: Covers OWASP Top 10 and common security patterns
- **Smart Pattern Matching**: Regular expression-based rule engine for accurate detection

### 🎯 Security Rules Covered

#### Execution Vulnerabilities

- `eval()` usage in JavaScript/Python
- `exec()` and `execSync()` injection
- Shell command injection via `os.system()` or `subprocess`

#### Credential Management

- Hardcoded passwords and API keys
- Insecure credential storage
- Default credentials

#### Injection Attacks

- **SQL Injection**: String concatenation in SQL queries
- **Command Injection**: User input in shell commands
- **NoSQL Injection**: Dynamic query construction
- **LDAP Injection**: Unsafe LDAP filter building

#### Cryptography Issues

- MD5 and SHA-1 hash functions
- Hardcoded cryptographic keys
- Disabled SSL/TLS verification

#### Web Security

- Cross-Site Scripting (XSS) via `innerHTML`
- Unvalidated redirects
- Missing authentication checks
- CSRF protection gaps
- Missing security headers

#### Data & Serialization

- Unsafe deserialization (`pickle.loads()`)
- XML External Entities (XXE)
- Insecure randomness (`Math.random()`)

#### Java-Specific

- JDBC SQL injection
- Hardcoded IP addresses
- Unsafe XML parsing

### 📋 Inline Diagnostics

- **Color-Coded Severity**:
  - 🛑 **High** (Red) - Critical vulnerabilities
  - ⚠️ **Medium** (Orange) - Important issues
  - ℹ️ **Low** (Blue) - Informational findings

- **Editor Integration**:
  - Red squiggly underlines on vulnerable lines
  - Problems panel with detailed information
  - Hover tooltips with explanations

### 🔧 Quick Fixes

- **One-Click Remediation**: Apply suggested fixes to vulnerable code
- **Smart Replacements**: Context-aware fix suggestions
- **Auto Re-scan**: Automatically re-analyzes file after fix application

### 📝 Hover Information

- Detailed vulnerability explanation
- Recommended fix strategy
- Links to security resources (OWASP)

## Installation

### From VSIX File

1. Download the `.vsix` file from releases
2. In VS Code: `Extensions > ... > Install from VSIX...`
3. Select the `codats-1.0.0.vsix` file

### Development Installation

1. Clone the repository
2. Run `npm install`
3. Press `F5` to launch Extension Development Host

## Usage

### Automatic Scanning

Files are automatically scanned when you:

- Open a new file
- Save changes (with 500ms debounce)
- Type in the editor (with 1000ms debounce)

### Manual Commands

Use the **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **CODATS: Scan Current File** - Scans the active editor
- **CODATS: Scan All Files in Workspace** - Scans all supported files
- **CODATS: Clear All Diagnostics** - Removes all detected issues

### Quick Fix Actions

1. Click on a red underlined vulnerability
2. Use `Ctrl+.` (Quick Fix) to open code actions
3. Select "Apply secure fix for [vulnerability]"
4. Review and save the changes

### Hover Tooltips

1. Hover over a vulnerability line
2. A popup shows:
   - Rule ID and severity
   - Detailed message
   - Suggested fix approach
   - Links to documentation

## Security Design

### Core Principles

✅ **Never Executes Code** - 100% static analysis only  
✅ **No Network Communication** - Works completely offline  
✅ **No Auto-Fixes** - User must approve all changes  
✅ **No Data Logging** - All analysis stays on your machine  
✅ **Read-Only Analysis** - Extension never modifies files without permission

### Architecture

```
extension.ts               Main entry point, event handlers
├── scanner/
│   ├── ruleEngine.ts     Scanning logic, pattern matching
│   └── rules.ts          Vulnerability patterns & metadata
└── providers/
    ├── CodeActionProvider  Quick fix implementation
    └── HoverProvider      Information tooltips
```

### Vulnerability Detection Method

1. **Pattern Matching**: Uses regular expressions to find suspicious patterns
2. **Line-by-Line Analysis**: Scans code line-by-line for efficiency
3. **Language-Aware**: Only applies rules relevant to the file language
4. **Comment Skipping**: Ignores code in comments and strings

## Supported Languages

| Language   | Format  | Detection    |
| ---------- | ------- | ------------ |
| JavaScript | `.js`   | Full support |
| TypeScript | `.ts`   | Full support |
| Python     | `.py`   | Full support |
| Java       | `.java` | Full support |

## Example Detections

### 1. eval() Usage

```javascript
// ❌ DETECTED: eval() is dangerous
const result = eval(userInput);

// ✅ FIXED: Use JSON.parse() instead
const result = JSON.parse(userInput);
```

### 2. Hardcoded Credentials

```python
# ❌ DETECTED: Hardcoded API key
API_KEY = "sk-1234567890abcdef"

# ✅ FIXED: Use environment variables
API_KEY = os.getenv("API_KEY")
```

### 3. SQL Injection

```javascript
// ❌ DETECTED: String concatenation in SQL
const query = "SELECT * FROM users WHERE id = " + userId;

// ✅ FIXED: Use parameterized queries
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);
```

### 4. XSS Vulnerability

```javascript
// ❌ DETECTED: innerHTML with untrusted data
element.innerHTML = userContent;

// ✅ FIXED: Use textContent or sanitize
element.textContent = userContent;
// OR
element.innerHTML = DOMPurify.sanitize(userContent);
```

### 5. Weak Cryptography

```python
# ❌ DETECTED: MD5 is cryptographically broken
import hashlib
hash = hashlib.md5(password).digest()

# ✅ FIXED: Use SHA-256 or bcrypt
hash = hashlib.sha256(password).digest()
import bcrypt
hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
```

## Configuration

Currently, CODATS works with default settings. Future versions will support configuration via `settings.json`:

```json
{
  "codats.enableRealTimeScanning": true,
  "codats.scanOnSave": true,
  "codats.minimumSeverity": "Medium",
  "codats.autoFixOnSave": false
}
```

## Performance

- **Lightweight**: Minimal impact on editor performance
- **Debouncing**: Scanning is debounced on file changes (1000ms)
- **Efficient**: Line-by-line analysis with early exit
- **Memory**: Rules are compiled once at startup

## Known Limitations

1. **No Control Flow Analysis**: Cannot trace variable assignments across functions
2. **No Type Information**: Python/JS dynamic typing limits some detections
3. **Regex Limitations**: Cannot detect all injection patterns
4. **False Positives**: Some patterns may be detected in safe contexts

**Recommendation**: Use CODATS as part of a comprehensive security strategy alongside:

- Dynamic analysis (DAST)
- Penetration testing
- Security code review
- Static analysis tools (SonarQube, Checkmarx)

## Rules Reference

### Complete List of Detections

| Rule ID                     | Severity | Pattern                   | Languages        |
| --------------------------- | -------- | ------------------------- | ---------------- |
| `eval-usage`                | High     | `eval()` calls            | JS, Python       |
| `exec-usage`                | High     | `exec()` calls            | Python           |
| `hardcoded-password`        | High     | Hardcoded credentials     | JS, Python, Java |
| `hardcoded-api-key`         | High     | API keys in code          | JS, Python, Java |
| `sql-injection-concat`      | High     | SQL + string concat       | JS, Python, Java |
| `sql-injection-template`    | High     | SQL template literals     | JS               |
| `command-injection-exec`    | High     | Shell with `${}`          | JS               |
| `python-command-injection`  | High     | `os.system()` with input  | Python           |
| `pickle-deserialization`    | High     | `pickle.loads()`          | Python           |
| `innerHTML-xss`             | High     | `innerHTML` assignment    | JS               |
| `weak-crypto-md5`           | High     | MD5 hashing               | JS, Python, Java |
| `weak-crypto-sha1`          | High     | SHA-1 hashing             | JS, Python, Java |
| `disabled-tls-verification` | High     | SSL/TLS disabled          | JS, Python, Java |
| `path-traversal`            | High     | File path from user input | JS, Python, Java |
| `default-credentials`       | High     | Default username/password | JS, Python, Java |
| `java-sql-injection`        | High     | JDBC SQL injection        | Java             |
| `unvalidated-redirect`      | Medium   | Redirect from user input  | JS, Java         |
| `missing-auth-check`        | Medium   | Route without auth        | JS               |
| `insecure-random-js`        | Medium   | `Math.random()`           | JS               |
| `insecure-random-python`    | Medium   | `random` module           | Python           |
| `xxe-vulnerability`         | Medium   | XML parsing               | Java, Python     |
| `missing-csrf-token`        | Medium   | POST without CSRF         | JS               |
| `sensitive-logging`         | Medium   | Credentials in logs       | JS, Python, Java |
| `missing-security-header`   | Low      | No security headers       | JS               |

## Roadmap

### Version 1.0 (Current)

✅ Real-time vulnerability detection  
✅ Quick fix code actions  
✅ Multi-language support  
✅ 40+ security rules

### Version 1.1 (Planned)

🔄 Configuration support  
🔄 Rule severity customization  
🔄 Ignore/suppress functionality

### Version 2.0 (Future)

🔄 Machine Learning confidence scoring  
🔄 LLM-powered explanations  
🔄 Custom rule creation  
🔄 Security trend reporting

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-rule`)
3. Add tests for new rules
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Security Disclosure

If you find a vulnerability in CODATS itself:

1. **Do not** open a public issue
2. Email: security@codats.dev
3. Include: vulnerability details, impact, suggested fix

## Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: [Full Docs](https://codats.dev)
- **OWASP Resources**: https://owasp.org/
- **CWE Database**: https://cwe.mitre.org/

## FAQ

**Q: Can CODATS fix vulnerabilities automatically?**  
A: No. CODATS suggests fixes but requires user approval. This prevents incorrect modifications.

**Q: Does CODATS send code to servers?**  
A: No. All analysis is local. The extension never makes network requests.

**Q: Can I disable real-time scanning?**  
A: Currently it's always on, but future versions will add configuration options.

**Q: How often are rules updated?**  
A: Rules are updated with VS Code extension updates (typically monthly).

**Q: Does CODATS detect all vulnerabilities?**  
A: No. It's a static analysis tool and cannot detect logic errors or runtime issues. Use it as part of a comprehensive security strategy.

**Q: Why are some vulnerabilities not detected?**  
A: Complex vulnerabilities require control flow analysis. CODATS uses regex patterns which have limitations for certain detection scenarios.

## Release Notes

### 1.0.0

Initial release of CODATS security analyzer with:

- Real-time vulnerability detection
- 40+ security rules
- Multi-language support (JS, TS, Python, Java)
- Quick fix code actions
- Hover tooltips and diagnostics

---

**Stay secure! 🛡️**

Made with ❤️ for secure coding • Powered by VS Code API & TypeScript

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
