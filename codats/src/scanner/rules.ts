/**
 * CODATS Vulnerability Rules
 * Defines patterns for detecting common security vulnerabilities
 */

export interface VulnerabilityRule {
  id: string;
  pattern: RegExp;
  severity: 'High' | 'Medium' | 'Low';
  message: string;
  fix: string;
  languages: string[]; // js, python, java
}

export const VULNERABILITY_RULES: VulnerabilityRule[] = [
  // ============ EVAL() and Dynamic Code Execution ============
  {
    id: 'eval-usage',
    pattern: /\beval\s*\(/g,
    severity: 'High',
    message: 'eval() is dangerous and can execute arbitrary code. Use JSON.parse() or Function constructor with strict controls instead.',
    fix: 'Replace eval() with safer alternatives like JSON.parse() for parsing data or use static code analysis.',
    languages: ['js', 'python']
  },
  {
    id: 'exec-usage',
    pattern: /\bexec\s*\(/g,
    severity: 'High',
    message: 'exec() can execute arbitrary code. Avoid dynamic code execution. Use specific APIs instead.',
    fix: 'Replace exec() with specific, controlled function calls.',
    languages: ['python']
  },
  {
    id: 'python-exec',
    pattern: /\bexec\s*\(/g,
    severity: 'High',
    message: 'exec() in Python can execute arbitrary code. This is a critical security risk.',
    fix: 'Use safer alternatives like ast.literal_eval() for evaluating literals or specific parsing functions.',
    languages: ['python']
  },

  // ============ Hardcoded Credentials ============
  {
    id: 'hardcoded-password',
    pattern: /(?:password|passwd|pwd|secret|api[_-]?key|token|auth)\s*[:=]\s*['"](.*?)['"]/gi,
    severity: 'High',
    message: 'Hardcoded credentials detected. Move secrets to environment variables or secure vaults.',
    fix: 'Use process.env.PASSWORD or os.getenv("PASSWORD") to fetch credentials from environment.',
    languages: ['js', 'python', 'java']
  },
  {
    id: 'hardcoded-api-key',
    pattern: /(?:api[_-]?key|apikey|access[_-]?key)\s*[:=]\s*['"]([\w\-]{20,})['"]/gi,
    severity: 'High',
    message: 'API key detected in code. Credentials should never be hardcoded.',
    fix: 'Move API keys to .env files or secrets management system (e.g., Azure Key Vault, AWS Secrets Manager).',
    languages: ['js', 'python', 'java']
  },

  // ============ SQL Injection ============
  {
    id: 'sql-injection-concat',
    pattern: /(?:query|execute|sql)\s*\(\s*['"]\s*SELECT.*?['"][\s+]*\+\s*|\bSELECT\s+.*?\s+FROM\s+.*?['"][\s+]*\+/gi,
    severity: 'High',
    message: 'Potential SQL injection: String concatenation in SQL queries. Use parameterized queries instead.',
    fix: 'Use prepared statements or parameterized queries: db.query("SELECT * FROM users WHERE id = ?", [userId])',
    languages: ['js', 'python', 'java']
  },
  {
    id: 'sql-injection-template',
    pattern: /(?:query|execute|sql)\s*\(\s*`.*?\$\{.*?\}.*?`/gi,
    severity: 'High',
    message: 'Potential SQL injection: Template literal with variable interpolation in SQL. Use parameterized queries.',
    fix: 'Use prepared statements: db.query("SELECT * FROM users WHERE id = $1", [userId])',
    languages: ['js']
  },

  // ============ Command Injection ============
  {
    id: 'command-injection-exec',
    pattern: /(?:exec|execSync|spawn|child_process)\s*\(\s*['"]\s*.*?\$\{.*?\}.*?['"]/gi,
    severity: 'High',
    message: 'Potential command injection: User input in shell command. Use parameterized execution.',
    fix: 'Use execFile() with array arguments or spawn() instead of shell execution: execFile("ls", ["-la", dir])',
    languages: ['js']
  },
  {
    id: 'python-command-injection',
    pattern: /(?:os\.system|subprocess\.call|subprocess\.Popen)\s*\(\s*['"]\s*.*?\{.*?\}.*?['"]/gi,
    severity: 'High',
    message: 'Potential command injection in Python: String formatting with shell commands.',
    fix: 'Use subprocess.run() with list arguments: subprocess.run(["ls", "-la", dir], check=True)',
    languages: ['python']
  },
  {
    id: 'shell-injection',
    pattern: /os\.system\s*\(\s*['"](.*?)['"]\s*\+\s*|os\.system\s*\(\s*f?['"](.*?\{.*?\}.*?)['"]/gi,
    severity: 'High',
    message: 'Shell command injection risk: Never concatenate user input into system commands.',
    fix: 'Use subprocess module with array arguments instead of os.system()',
    languages: ['python']
  },

  // ============ Insecure Deserialization ============
  {
    id: 'pickle-deserialization',
    pattern: /pickle\s*\.\s*(?:loads|load)\s*\(/g,
    severity: 'High',
    message: 'pickle.loads() can execute arbitrary code. Use json.loads() for untrusted data.',
    fix: 'Replace pickle with json for untrusted data, or validate serialized data thoroughly.',
    languages: ['python']
  },
  {
    id: 'unsafe-json-parse',
    pattern: /JSON\s*\.\s*parse\s*\(\s*(?:eval|Function)\s*\(/gi,
    severity: 'High',
    message: 'Unsafe deserialization: JSON.parse() with eval/Function.',
    fix: 'Use standard JSON.parse() without eval wrapper.',
    languages: ['js']
  },

  // ============ Unvalidated Redirects ============
  {
    id: 'unvalidated-redirect',
    pattern: /(?:redirect|location|window\.location)\s*=\s*(?:req\.|request\.)?(?:query|params|body)\[?['"]/gi,
    severity: 'Medium',
    message: 'Unvalidated redirect: User input directly controls redirect destination.',
    fix: 'Validate redirect URL against whitelist: const ALLOWED_HOSTS = ["example.com"]; if (allowedHosts.includes(url.host)) { redirect(url); }',
    languages: ['js', 'java']
  },

  // ============ Cross-Site Scripting (XSS) ============
  {
    id: 'innerHTML-xss',
    pattern: /\.\s*innerHTML\s*=\s*(?!.*(?:innerHTML\s*=\s*DOMPurify\.sanitize))/gi,
    severity: 'High',
    message: 'innerHTML assignment: Vulnerable to XSS if content contains user input.',
    fix: 'Use textContent for text or DOMPurify.sanitize() for HTML: element.innerHTML = DOMPurify.sanitize(userInput)',
    languages: ['js']
  },
  {
    id: 'xss-unescaped-output',
    pattern: /<%=\s*(?!.*h\()/gi,
    severity: 'High',
    message: 'Unescaped output in template: Vulnerable to XSS.',
    fix: 'Use escaped output: <%- or use h() helper: <%= h(variable) %>',
    languages: ['js']
  },

  // ============ Missing Authentication ============
  {
    id: 'missing-auth-check',
    pattern: /(?:router|app)\s*\.(?:get|post|put|delete)\s*\(\s*['"](.*?)['"],\s*(?:\(req,\s*res\)|async.*?\))\s*=>\s*\{(?![\s\S]*?(?:auth|middleware|verify|validate))/gi,
    severity: 'Medium',
    message: 'Route without authentication check detected.',
    fix: 'Add authentication middleware: app.post("/protected", authMiddleware, (req, res) => { ... })',
    languages: ['js']
  },

  // ============ Insecure Cryptography ============
  {
    id: 'weak-crypto-md5',
    pattern: /(?:md5|MD5)\s*\(/g,
    severity: 'High',
    message: 'MD5 is cryptographically broken. Use SHA-256 or bcrypt instead.',
    fix: 'Use crypto.createHash("sha256") or bcrypt for password hashing.',
    languages: ['js', 'python', 'java']
  },
  {
    id: 'weak-crypto-sha1',
    pattern: /(?:sha1|SHA1)\s*\(/g,
    severity: 'High',
    message: 'SHA-1 is deprecated for security. Use SHA-256 or stronger.',
    fix: 'Use crypto.createHash("sha256") or modern hashing algorithms.',
    languages: ['js', 'python', 'java']
  },
  {
    id: 'hardcoded-key',
    pattern: /(?:key|secret)\s*[:=]\s*['"](.*?)['"]|private[_\s]?key\s*[:=]\s*['"](.*?)['"]/gi,
    severity: 'High',
    message: 'Hardcoded cryptographic key detected. Keys should be managed securely.',
    fix: 'Move keys to environment variables or key management service.',
    languages: ['js', 'python', 'java']
  },

  // ============ Path Traversal ============
  {
    id: 'path-traversal',
    pattern: /(?:readFileSync|readFile|fs\.read|open|fopen)\s*\(\s*(?:path\.|req\.|request\.)?(?:query|params|body)\s*[,)]/gi,
    severity: 'High',
    message: 'Path traversal vulnerability: User input directly used in file operations.',
    fix: 'Validate and normalize path: const safe = path.normalize(userPath); if (!safe.startsWith(basePath)) throw new Error("Invalid path");',
    languages: ['js', 'python', 'java']
  },

  // ============ XML External Entities (XXE) ============
  {
    id: 'xxe-vulnerability',
    pattern: /(?:parseXml|XMLParser|DOMParser|libxml)\s*\(\s*['"]/gi,
    severity: 'Medium',
    message: 'XML parsing without XXE protection. Disable external entity processing.',
    fix: 'Disable XXE: parser.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)',
    languages: ['java', 'python']
  },

  // ============ Insecure Random ============
  {
    id: 'insecure-random-js',
    pattern: /Math\.random\s*\(\s*\)/g,
    severity: 'Medium',
    message: 'Math.random() is not cryptographically secure. Use crypto.getRandomValues() instead.',
    fix: 'Use crypto.getRandomValues(new Uint8Array(32)) for secure randomness.',
    languages: ['js']
  },
  {
    id: 'insecure-random-python',
    pattern: /random\s*\.\s*(?:random|choice|randint)\s*\(/g,
    severity: 'Medium',
    message: 'random module is not cryptographically secure. Use secrets module instead.',
    fix: 'Use secrets.randbelow(limit) or secrets.choice(seq) for secure randomness.',
    languages: ['python']
  },

  // ============ NoSQL Injection ============
  {
    id: 'nosql-injection',
    pattern: /(?:findOne|find|updateOne|deleteOne)\s*\(\s*\{[\s\S]*?\}\s*[+]/gi,
    severity: 'High',
    message: 'NoSQL injection: Dynamic query construction. Use parameterized methods.',
    fix: 'Use query object properly: db.collection.find({email: userEmail}) instead of string concatenation.',
    languages: ['js']
  },

  // ============ LDAP Injection ============
  {
    id: 'ldap-injection',
    pattern: /(?:ldapjs|ldap)\s*\.\s*(?:search|bind)\s*\(\s*['"]\s*.*?\+\s*|ldap.*?[+]\s*['"]/gi,
    severity: 'Medium',
    message: 'LDAP injection: String concatenation in LDAP queries.',
    fix: 'Use parameterized LDAP functions with properly escaped values.',
    languages: ['js']
  },

  // ============ Security Headers Missing ============
  {
    id: 'missing-security-header',
    pattern: /(?:app|router|response)\s*\.(?:use|get|post)\s*\(['"\/]/gi,
    severity: 'Low',
    message: 'Security headers (CSP, HSTS, X-Frame-Options) should be configured.',
    fix: 'Add middleware: app.use(helmet()); or manually set headers like res.setHeader("X-Frame-Options", "DENY")',
    languages: ['js']
  },

  // ============ Sensitive Data Logging ============
  {
    id: 'sensitive-logging',
    pattern: /(?:console\.log|print|logger\..+)\s*\(\s*(?:password|token|secret|key|credential|ssn|credit|api)/gi,
    severity: 'Medium',
    message: 'Sensitive data logged. Remove passwords, tokens, and credentials from logs.',
    fix: 'Replace with: console.log("User logged in"); // Don\'t log sensitive data',
    languages: ['js', 'python', 'java']
  },

  // ============ Java-Specific ============
  {
    id: 'java-sql-injection',
    pattern: /(?:Statement|executeQuery|executeUpdate)\s*\(\s*['"]\s*SELECT.*?['"][\s+]*\+\s*|Statement.*?execute\s*\(\s*['"]\s*.*?\+\s*/gi,
    severity: 'High',
    message: 'SQL injection in Java: String concatenation in SQL. Use PreparedStatement.',
    fix: 'Use PreparedStatement: PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE id = ?"); ps.setInt(1, userId);',
    languages: ['java']
  },
  {
    id: 'java-hardcoded-ip',
    pattern: /(?:localhost|127\.0\.0\.1|192\.168|10\.0|172\.16)[:\d]*/g,
    severity: 'Low',
    message: 'Hardcoded IP address detected. Use configuration files instead.',
    fix: 'Move to configuration: config.getProperty("server.ip")',
    languages: ['java']
  },

  // ============ Weak HTTPS/TLS ============
  {
    id: 'disabled-tls-verification',
    pattern: /(?:sslVerify|verifySSL|checkCertificate|SSL_VERIFYPEER)\s*[:=]\s*(?:false|0|no|disable)/gi,
    severity: 'High',
    message: 'SSL/TLS certificate verification disabled. This allows MITM attacks.',
    fix: 'Enable certificate verification or ensure trust store is properly configured.',
    languages: ['js', 'python', 'java']
  },

  // ============ CSRF Protection ============
  {
    id: 'missing-csrf-token',
    pattern: /(?:app|router)\s*\.(?:post|put|delete|patch)\s*\(['"]\s*\/[^"]*['"],.*?\)\s*=>\s*\{(?![\s\S]*?csrf|token|verify)/gi,
    severity: 'Medium',
    message: 'State-changing request without CSRF protection. Add CSRF token validation.',
    fix: 'Add CSRF middleware: app.use(csrf()); and validate tokens in forms: <input name="_csrf" value="<%= csrfToken %>" />',
    languages: ['js']
  },

  // ============ Default Credentials ============
  {
    id: 'default-credentials',
    pattern: /(?:username|user)\s*[:=]\s*['"](admin|root|test|demo|default|user)['"][\s\S]*?(?:password|pass)\s*[:=]\s*['"](admin|password|123456|test|default)['"]/gi,
    severity: 'High',
    message: 'Default credentials detected. Change default usernames and passwords.',
    fix: 'Use strong, unique credentials and rotate them regularly.',
    languages: ['js', 'python', 'java']
  }
];
