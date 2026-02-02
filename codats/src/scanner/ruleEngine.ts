/**
 * CODATS Rule Engine
 * Core scanning logic that applies vulnerability rules to code
 */

import { VULNERABILITY_RULES, VulnerabilityRule } from './rules';

export interface Issue {
  id: string;
  ruleId: string;
  line: number;
  column: number;
  severity: 'High' | 'Medium' | 'Low';
  message: string;
  fix: string;
  code: string; // the actual vulnerable code
}

export interface ScanResult {
  issues: Issue[];
  totalIssues: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
}

export class RuleEngine {
  /**
   * Scan code content against all vulnerability rules
   * @param code - The code content to scan
   * @param language - The programming language (js, python, java)
   * @returns Array of detected issues
   */
  scanCode(code: string, language: 'js' | 'python' | 'java'): ScanResult {
    const issues: Issue[] = [];
    const lines = code.split('\n');

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      const lineNumber = lineNum + 1;

      // Skip comments
      if (this.isComment(line, language)) {
        continue;
      }

      // Check each rule against this line
      for (const rule of VULNERABILITY_RULES) {
        // Skip rules not applicable to this language
        if (!rule.languages.includes(language)) {
          continue;
        }

        // Reset regex lastIndex for global patterns
        if (rule.pattern.global) {
          rule.pattern.lastIndex = 0;
        }

        let match;
        while ((match = rule.pattern.exec(line)) !== null) {
          const column = match.index + 1;
          const vulnerableCode = match[0].substring(0, 50); // Capture first 50 chars

          const issue: Issue = {
            id: `${rule.id}-${lineNumber}-${column}`,
            ruleId: rule.id,
            line: lineNumber,
            column: column,
            severity: rule.severity,
            message: rule.message,
            fix: rule.fix,
            code: vulnerableCode
          };

          issues.push(issue);

          // For non-global patterns, break after first match
          if (!rule.pattern.global) {
            break;
          }
        }
      }
    }

    // Sort issues by line number, then by severity
    issues.sort((a, b) => {
      if (a.line !== b.line) {
        return a.line - b.line;
      }
      const severityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    // Calculate summary statistics
    const highSeverity = issues.filter(i => i.severity === 'High').length;
    const mediumSeverity = issues.filter(i => i.severity === 'Medium').length;
    const lowSeverity = issues.filter(i => i.severity === 'Low').length;

    return {
      issues,
      totalIssues: issues.length,
      highSeverity,
      mediumSeverity,
      lowSeverity
    };
  }

  /**
   * Check if a line is a comment (should be skipped)
   */
  private isComment(line: string, language: string): boolean {
    const trimmed = line.trim();

    if (language === 'js' || language === 'java') {
      return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
    }

    if (language === 'python') {
      return trimmed.startsWith('#');
    }

    return false;
  }

  /**
   * Get a specific issue by ID
   */
  getIssueById(issues: Issue[], issueId: string): Issue | undefined {
    return issues.find(i => i.id === issueId);
  }

  /**
   * Filter issues by severity
   */
  filterBySeverity(issues: Issue[], severity: 'High' | 'Medium' | 'Low'): Issue[] {
    return issues.filter(i => i.severity === severity);
  }

  /**
   * Get the worst severity in a set of issues
   */
  getWorstSeverity(issues: Issue[]): 'High' | 'Medium' | 'Low' | null {
    if (issues.some(i => i.severity === 'High')) {
      return 'High';
    }
    if (issues.some(i => i.severity === 'Medium')) {
      return 'Medium';
    }
    if (issues.some(i => i.severity === 'Low')) {
      return 'Low';
    }
    return null;
  }
}

// Export singleton instance
export const ruleEngine = new RuleEngine();
