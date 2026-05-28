const SENSITIVE_PATTERNS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /apikey/i,
  /api_key/i,
  /api[-_]?key/i,
  /auth/i,
  /credential/i,
  /ssn/i,
  /social[-_]?security/i,
  /credit[-_]?card/i,
  /card[-_]?number/i,
  /cvv/i,
  /cvc/i,
  /pin/i,
  /bank[-_]?account/i,
  /routing[-_]?number/i,
  /private[-_]?key/i,
  /pwd/i,
];

function isSensitiveColumn(name: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(name));
}

function maskValue(value: any, columnName: string): any {
  if (value === null || value === undefined) return value;
  const str = String(value);
  if (str.length <= 4) return '****';
  if (columnName.toLowerCase().includes('email')) {
    const at = str.indexOf('@');
    if (at > 0) {
      return str[0] + '***' + str.slice(at - 1);
    }
  }
  if (
    /credit[-_]?card/i.test(columnName) ||
    /card[-_]?number/i.test(columnName)
  ) {
    const digits = str.replace(/\D/g, '');
    if (digits.length >= 4) {
      return '****-****-****-' + digits.slice(-4);
    }
  }
  return str[0] + '****' + str.slice(-1);
}

export function maskSensitiveData(rows: any[]): any[] {
  if (!rows || rows.length === 0) return rows;
  const sample = rows[0];
  if (typeof sample !== 'object' || sample === null) return rows;
  const sensitiveColumns = Object.keys(sample).filter(isSensitiveColumn);
  if (sensitiveColumns.length === 0) return rows;
  return rows.map((row) => {
    const masked = { ...row };
    for (const col of sensitiveColumns) {
      masked[col] = maskValue(masked[col], col);
    }
    return masked;
  });
}
