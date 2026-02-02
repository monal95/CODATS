/**
 * CODATS - AI-Assisted Static Code Security Analyzer
 * Main extension entry point with diagnostics, quick fixes, and file scanning
 */

import * as vscode from 'vscode';
import { ruleEngine, Issue } from './scanner/ruleEngine';

// Create a diagnostic collection for storing issues
let diagnosticCollection: vscode.DiagnosticCollection;
const diagnosticSource = 'CODATS';

export function activate(context: vscode.ExtensionContext) {
	console.log('CODATS Security Analyzer is now active!');

	// Initialize diagnostic collection
	diagnosticCollection = vscode.languages.createDiagnosticCollection('codats');
	context.subscriptions.push(diagnosticCollection);

	// ============ COMMAND REGISTRATION ============
	// Register the manual scan command
	const scanCommand = vscode.commands.registerCommand('codats.scan', () => {
		scanCurrentFile();
	});
	context.subscriptions.push(scanCommand);

	// Register the scan all files command
	const scanAllCommand = vscode.commands.registerCommand('codats.scanAll', async () => {
		await scanAllFiles();
	});
	context.subscriptions.push(scanAllCommand);

	// Register the clear diagnostics command
	const clearCommand = vscode.commands.registerCommand('codats.clear', () => {
		diagnosticCollection.clear();
		vscode.window.showInformationMessage('CODATS diagnostics cleared');
	});
	context.subscriptions.push(clearCommand);

	// ============ EVENT LISTENERS ============
	// Scan on file open
	const openListener = vscode.workspace.onDidOpenTextDocument((doc: vscode.TextDocument) => {
		if (isSupportedLanguage(doc.languageId)) {
			scanDocument(doc);
		}
	});
	context.subscriptions.push(openListener);

	// Scan on file save (with debouncing)
	let saveTimeout: NodeJS.Timeout | undefined;
	const saveListener = vscode.workspace.onDidSaveTextDocument((doc: vscode.TextDocument) => {
		if (isSupportedLanguage(doc.languageId)) {
			// Debounce to avoid excessive scanning
			if (saveTimeout) {
				clearTimeout(saveTimeout);
			}
			saveTimeout = setTimeout(() => {
				scanDocument(doc);
			}, 500);
		}
	});
	context.subscriptions.push(saveListener);

	// Scan on file change (real-time analysis - optional, can be disabled for performance)
	let changeTimeout: NodeJS.Timeout | undefined;
	const changeListener = vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
		if (isSupportedLanguage(event.document.languageId)) {
			// Debounce to improve performance
			if (changeTimeout) {
				clearTimeout(changeTimeout);
			}
			changeTimeout = setTimeout(() => {
				scanDocument(event.document);
			}, 1000);
		}
	});
	context.subscriptions.push(changeListener);

	// ============ CODE ACTION PROVIDER ============
	// Register code action provider for quick fixes
	const codeActionProvider = vscode.languages.registerCodeActionsProvider(
		['javascript', 'typescript', 'python', 'java'],
		new CodatsCodeActionProvider(),
		{
			providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
		}
	);
	context.subscriptions.push(codeActionProvider);

	// ============ HOVER PROVIDER ============
	// Register hover provider for showing fix suggestions
	const hoverProvider = vscode.languages.registerHoverProvider(
		['javascript', 'typescript', 'python', 'java'],
		new CodatsHoverProvider()
	);
	context.subscriptions.push(hoverProvider);

	// Scan active editor on activation
	if (vscode.window.activeTextEditor) {
		const doc = vscode.window.activeTextEditor.document;
		if (isSupportedLanguage(doc.languageId)) {
			scanDocument(doc);
		}
	}

	vscode.window.showInformationMessage('CODATS Security Analyzer activated for JavaScript, Python, and Java files');
}

export function deactivate() {
	diagnosticCollection.dispose();
}

/**
 * Check if a file language is supported by CODATS
 */
function isSupportedLanguage(languageId: string): boolean {
	const supported = ['javascript', 'typescript', 'python', 'java', 'json'];
	return supported.includes(languageId);
}

/**
 * Get the programming language for a given VS Code language ID
 */
function getLanguageFromVSCode(languageId: string): 'js' | 'python' | 'java' | null {
	switch (languageId) {
		case 'javascript':
		case 'typescript':
			return 'js';
		case 'python':
			return 'python';
		case 'java':
			return 'java';
		default:
			return null;
	}
}

/**
 * Scan the current active file
 */
function scanCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showWarningMessage('No file open to scan');
		return;
	}

	scanDocument(editor.document);
}

/**
 * Scan all files in the workspace
 */
async function scanAllFiles() {
	const files = await vscode.workspace.findFiles('**/*.{js,ts,py,java}', '**/node_modules/**', 1000);
	
	if (files.length === 0) {
		vscode.window.showWarningMessage('No supported files found in workspace');
		return;
	}

	let totalIssues = 0;
	let filesWithIssues = 0;

	for (const fileUri of files) {
		try {
			const doc = await vscode.workspace.openTextDocument(fileUri);
			const result = scanDocument(doc);
			if (result.issues.length > 0) {
				filesWithIssues++;
				totalIssues += result.issues.length;
			}
		} catch (error) {
			console.error(`Failed to scan ${fileUri}:`, error);
		}
	}

	vscode.window.showInformationMessage(
		`Scan complete: Found ${totalIssues} issues in ${filesWithIssues} files`
	);
}

/**
 * Scan a document and update diagnostics
 */
function scanDocument(document: vscode.TextDocument) {
	const language = getLanguageFromVSCode(document.languageId);
	if (!language) {
		return { issues: [] };
	}

	// Run the scan
	const scanResult = ruleEngine.scanCode(document.getText(), language);
	const issues = scanResult.issues;

	// Convert issues to VS Code diagnostics
	const diagnostics: vscode.Diagnostic[] = issues.map((issue: Issue) => {
		const range = new vscode.Range(
			new vscode.Position(issue.line - 1, Math.max(0, issue.column - 1)),
			new vscode.Position(issue.line - 1, issue.column + issue.code.length)
		);

		const severity = mapSeverity(issue.severity);
		const diagnostic = new vscode.Diagnostic(
			range,
			`[${issue.ruleId}] ${issue.message}`,
			severity
		);

		diagnostic.code = issue.ruleId;
		diagnostic.source = diagnosticSource;
		diagnostic.tags = issue.severity === 'High' ? [vscode.DiagnosticTag.Unnecessary] : undefined;

		// Store issue data for quick fixes
		(diagnostic as any).issue = issue;

		return diagnostic;
	});

	// Update the diagnostic collection
	diagnosticCollection.set(document.uri, diagnostics);

	// Show status bar message
	updateStatusBar(scanResult);

	return scanResult;
}

/**
 * Update status bar with scan results
 */
function updateStatusBar(scanResult: any) {
	const icon = scanResult.highSeverity > 0 ? '🛑' : scanResult.mediumSeverity > 0 ? '⚠️' : '✅';
	const message = `${icon} CODATS: ${scanResult.totalIssues} issues (${scanResult.highSeverity} High, ${scanResult.mediumSeverity} Medium, ${scanResult.lowSeverity} Low)`;
	
	// This can be displayed in status bar or as a notification
	if (scanResult.totalIssues > 0) {
		console.log(message);
	}
}

/**
 * Map CODATS severity to VS Code DiagnosticSeverity
 */
function mapSeverity(severity: 'High' | 'Medium' | 'Low'): vscode.DiagnosticSeverity {
	switch (severity) {
		case 'High':
			return vscode.DiagnosticSeverity.Error;
		case 'Medium':
			return vscode.DiagnosticSeverity.Warning;
		case 'Low':
			return vscode.DiagnosticSeverity.Information;
		default:
			return vscode.DiagnosticSeverity.Warning;
	}
}

/**
 * Code Action Provider for quick fixes
 */
class CodatsCodeActionProvider implements vscode.CodeActionProvider {
	provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection,
		context: vscode.CodeActionContext,
		token: vscode.CancellationToken
	): vscode.CodeAction[] {
		const codeActions: vscode.CodeAction[] = [];

		// Find diagnostics in the current range
		for (const diagnostic of context.diagnostics) {
			if (diagnostic.source === diagnosticSource && (diagnostic as any).issue) {
				const issue: Issue = (diagnostic as any).issue;
				
				// Create a quick fix action
				const action = new vscode.CodeAction(
					`Apply secure fix for ${issue.ruleId}`,
					vscode.CodeActionKind.QuickFix
				);

				action.edit = new vscode.WorkspaceEdit();
				
				// Replace the vulnerable code with fix suggestion
				const line = document.lineAt(issue.line - 1);
				const range = new vscode.Range(
					new vscode.Position(issue.line - 1, 0),
					new vscode.Position(issue.line - 1, line.text.length)
				);

				// Generate a safe replacement
				const replacement = generateSafeFix(issue, line.text);
				action.edit.replace(document.uri, range, replacement);

				// Add a command to re-scan after fix
				action.command = {
					command: 'codats.scan',
					title: 'Re-scan after fix'
				};

				codeActions.push(action);

				// Add explanation action
				const explainAction = new vscode.CodeAction(
					`Explain vulnerability: ${issue.ruleId}`,
					vscode.CodeActionKind.QuickFix
				);
				explainAction.command = {
					command: '_codats.explain',
					title: 'Explain',
					arguments: [issue]
				};
				codeActions.push(explainAction);
			}
		}

		return codeActions;
	}
}

/**
 * Hover Provider for showing issue details
 */
class CodatsHoverProvider implements vscode.HoverProvider {
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Hover> {
		const diagnostics = diagnosticCollection.get(document.uri);
		if (!diagnostics) {
			return null;
		}

		// Find diagnostic at this position
		const diagnostic = diagnostics.find(d => {
			return d.range.contains(position);
		});

		if (!diagnostic || !diagnostic.source?.includes('CODATS')) {
			return null;
		}

		const issue: Issue = (diagnostic as any).issue;
		if (!issue) {
			return null;
		}

		const markdown = new vscode.MarkdownString();
		markdown.appendMarkdown(`### 🔒 Security Issue: ${issue.ruleId}\n\n`);
		markdown.appendMarkdown(`**Severity:** ${issue.severity}\n\n`);
		markdown.appendMarkdown(`**Message:** ${issue.message}\n\n`);
		markdown.appendMarkdown(`**Suggested Fix:** \`${issue.fix}\`\n\n`);
		markdown.appendMarkdown(`[Learn more](https://owasp.org/)\n`);

		return new vscode.Hover(markdown);
	}
}

/**
 * Generate a safe fix for a vulnerability
 */
function generateSafeFix(issue: Issue, originalLine: string): string {
	const fixes: Record<string, (line: string) => string> = {
		'eval-usage': (line: string) => {
			return line.replace(/\beval\s*\(/g, 'JSON.parse(');
		},
		'hardcoded-password': (line: string) => {
			return line.replace(
				/(?:password|passwd|pwd|secret)\s*[:=]\s*['"](.*)['"]|/gi,
				'process.env.PASSWORD // Use environment variable instead'
			);
		},
		'hardcoded-api-key': (line: string) => {
			return line.replace(
				/(?:api[_-]?key|apikey)\s*[:=]\s*['"].+['"]/gi,
				'process.env.API_KEY // Store API keys in environment variables'
			);
		},
		'weak-crypto-md5': (line: string) => {
			return line.replace(/(?:md5|MD5)\s*\(/gi, 'crypto.createHash("sha256")(');
		},
		'weak-crypto-sha1': (line: string) => {
			return line.replace(/(?:sha1|SHA1)\s*\(/gi, 'crypto.createHash("sha256")(');
		},
		'sql-injection-concat': (line: string) => {
			return line.replace(
				/\bSELECT\s+.*?\s+FROM\s+.*?\s*\+/gi,
				'db.query("SELECT * FROM table WHERE id = ?", [userId]); //'
			);
		},
		'innerHTML-xss': (line: string) => {
			return line.replace(/\.innerHTML\s*=/g, '.textContent = // or use DOMPurify.sanitize() for HTML');
		},
		'disabled-tls-verification': (line: string) => {
			return line.replace(
				/(?:sslVerify|verifySSL|SSL_VERIFYPEER)\s*[:=]\s*(?:false|0|no|disable)/gi,
				'sslVerify = true // Always verify SSL certificates'
			);
		}
	};

	const fixer = fixes[issue.ruleId];
	if (fixer) {
		return fixer(originalLine);
	}

	// Default: just comment out the line with a fix suggestion
	return `// FIXED: ${originalLine.trim()} // Apply the fix: ${issue.fix}`;
}
