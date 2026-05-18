/**
 * QueryValidatorUtils — validates SQL queries for safety before execution.
 *
 * Prevents destructive SQL statements (DROP, DELETE, INSERT, UPDATE, ALTER, TRUNCATE,
 * CREATE, EXEC, etc.) from being executed via the reporting engine.
 * Only SELECT and WITH (CTE) statements are permitted.
 */
export class QueryValidatorUtils {
  private static readonly BLOCKED_PATTERNS = [
    /\bDROP\b/i,
    /\bDELETE\b/i,
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bALTER\b/i,
    /\bTRUNCATE\b/i,
    /\bCREATE\b/i,
    /\bEXEC\b/i,
    /\bEXECUTE\b/i,
    /\bGRANT\b/i,
    /\bREVOKE\b/i,
    /\bRENAME\b/i,
    /\bREPLACE\b/i,
    /\bLOAD\b/i,
    /\bMERGE\b/i,
    /\bUNION\b/i,
    /\/\*.*\*\//s,
    /;\s*SELECT/i,
    /@@version/i,
    /xp_cmdshell/i,
    /WAITFOR\s+DELAY/i,
  ];

  /**
   * Validates a SQL query string. Throws if dangerous patterns are found.
   * Only allows SELECT and WITH (CTE) statements.
   *
   * @param sql - The SQL query string to validate
   * @throws BadRequestException if the query is unsafe
   */
  public static validateQuery(sql: string): void {
    if (!sql || sql.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    const normalized = sql.trim();

    // Must start with SELECT or WITH (CTE)
    if (!/^\s*(SELECT|WITH)\b/i.test(normalized)) {
      throw new Error('Only SELECT and WITH (CTE) queries are permitted');
    }

    // Check for blocked patterns
    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(sql)) {
        throw new Error(
          `Query validation failed: blocked SQL pattern detected`,
        );
      }
    }
  }
}
