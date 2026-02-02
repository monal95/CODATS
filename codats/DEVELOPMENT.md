# CODATS Development & Testing Guide

## Prerequisites

- Node.js 18+
- VS Code 1.108.1+
- npm

## Setup

```bash
# Clone or open the project
cd d:\Project\CODATS\codats

# Install dependencies
npm install
```

## Development Workflow

### 1. Start Development Mode

Two options:

**Option A: Using VS Code**

- Open the project in VS Code
- Press `F5` to launch Extension Development Host
- This opens a new VS Code window with CODATS enabled

**Option B: Using Commands**

```bash
npm run watch
```

This runs both TypeScript compiler and esbuild in watch mode for hot reload.

### 2. Test Files

Sample vulnerable files are included:

- `test-vulnerable.js` - JavaScript vulnerabilities
- `test-vulnerable.py` - Python vulnerabilities

Open these in the Extension Development Host to see CODATS in action.

## Building

### Compilation Only

```bash
npm run check-types   # TypeScript type checking
npm run lint          # ESLint analysis
npm run compile       # Full build
```

### Production Build

```bash
npm run package
```

## Testing

### Run Tests

```bash
npm test
```

### Watch Tests

```bash
npm run watch-tests
```

## Extension Commands (in Dev Host)

1. **Ctrl+Shift+P** to open Command Palette
2. Type one of:
   - `CODATS: Scan Current File` - Scan active editor
   - `CODATS: Scan All Files in Workspace` - Scan entire workspace
   - `CODATS: Clear All Diagnostics` - Remove all detected issues

## Features to Test

### ✅ Auto-Scanning

- Open `test-vulnerable.js` or `test-vulnerable.py`
- Issues should appear immediately with red underlines
- Check Problems panel (Ctrl+Shift+M)

### ✅ Quick Fixes

1. Click on a red underline
2. Press `Ctrl+.` (Quick Fix)
3. Select "Apply secure fix for [rule-id]"
4. Changes apply and re-scan runs

### ✅ Hover Tooltips

1. Hover over a vulnerability
2. Tooltip shows:
   - Rule ID and severity
   - Message
   - Fix suggestion

### ✅ Multiple Languages

1. Create test files in different languages
2. Verify issues detected for each language:
   - JavaScript (.js, .ts)
   - Python (.py)
   - Java (.java)

### ✅ Severity Levels

- High (Red): Critical vulnerabilities
- Medium (Orange): Important issues
- Low (Blue): Informational findings

## Project Structure

```
src/
├── extension.ts           # Main entry point
├── scanner/
│   ├── ruleEngine.ts      # Scanning logic
│   └── rules.ts           # Vulnerability patterns
└── test/
    └── extension.test.ts  # Unit tests

dist/                      # Compiled output (auto-generated)
package.json              # Dependencies & scripts
tsconfig.json             # TypeScript config
esbuild.js                # Bundler config
```

## Debugging

### Debug Extension Itself

1. Press `F5` in main VS Code
2. Opens Extension Development Host
3. Any console.log() calls appear in Debug Console

### Debug Scan Output

In `extension.ts`, add:

```typescript
console.log("Scan result:", scanResult);
```

Then check the Debug Console in the Extension Development Host.

## Common Issues & Solutions

### Issue: Extensions don't activate

**Solution**: Check `activationEvents` in package.json

- Must include language IDs: `onLanguage:javascript`, `onLanguage:python`, etc.

### Issue: Rules not matching

**Solution**: Check RegExp syntax in `rules.ts`

- Test patterns with online RegExp tool
- Remember `/g` flag for global matching

### Issue: Performance slow

**Solution**:

- Debouncing is applied (1000ms on change)
- Can increase timeout in `extension.ts`
- Avoid scanning very large files

### Issue: Changes not reflecting

**Solution**:

- Rebuild with `npm run compile`
- Reload Extension Development Host (Ctrl+R)

## Publishing

### Generate VSIX Package

```bash
npm install -g vsce
vsce package
```

Creates `codats-1.0.0.vsix` that can be:

- Distributed locally
- Installed via `Extensions > ... > Install from VSIX...`
- Submitted to VS Code Marketplace

### Upload to Marketplace

```bash
vsce publish
```

Requires:

- Personal Access Token from Microsoft
- Publisher account on marketplace.visualstudio.com

## Performance Benchmarks

- **Typical file scan**: < 50ms
- **Large file (1000+ lines)**: < 200ms
- **Scan all workspace files**: Depends on count
  - 100 files: ~5 seconds
  - 1000 files: ~50 seconds

## Security Considerations

### Extension Security

- ✅ Never executes user code
- ✅ No network requests
- ✅ No file modifications without user approval
- ✅ No sensitive data logging

### Rule Engine Security

- Only static pattern matching
- No dynamic code evaluation
- Safe regex compilation

## Contributing New Rules

### Add a Rule

1. Open `src/scanner/rules.ts`
2. Add to `VULNERABILITY_RULES` array:

```typescript
{
  id: 'new-vulnerability',
  pattern: /pattern_here/g,
  severity: 'High',
  message: 'Description of the issue',
  fix: 'How to fix it',
  languages: ['js', 'python', 'java']
}
```

3. Compile: `npm run compile`
4. Test in Extension Development Host

### Test Your Rule

1. Create sample vulnerable code
2. Open in Extension Development Host
3. Verify detection
4. Test quick fix if provided

## Troubleshooting

### Enable Verbose Logging

Add to `extension.ts`:

```typescript
if (process.env.DEBUG) {
  console.log("Debug mode enabled");
  console.log("Scanning:", document.uri);
}
```

Run with:

```bash
DEBUG=true code
```

### Check Extension Logs

In Extension Development Host:

- View > Output
- Select "CODATS" from dropdown

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [OWASP Security Guidelines](https://owasp.org/)
- [CWE Database](https://cwe.mitre.org/)

---

Happy secure coding! 🛡️
