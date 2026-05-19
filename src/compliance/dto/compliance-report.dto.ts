export type ComplianceStandard = 'PCI-DSS' | 'SOX' | 'GDPR' | 'SOC2';

export type ComplianceStatus = 'compliant' | 'non-compliant' | 'pending-review';

export interface ComplianceCheckResult {
  standard: ComplianceStandard;
  status: ComplianceStatus;
  checkedAt: string;
  findings: ComplianceFinding[];
  score: number;
}

export interface ComplianceFinding {
  category: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  passed: boolean;
  recommendation?: string;
}

export interface ComplianceReportDto {
  id?: number;
  title: string;
  standard: ComplianceStandard;
  status: ComplianceStatus;
  summary: string;
  results: ComplianceCheckResult[];
  generatedAt: string;
  generatedBy?: string;
  reportUrl?: string;
}
