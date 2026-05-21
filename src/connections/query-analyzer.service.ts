import { Injectable, Logger } from '@nestjs/common';
import { DatabaseType } from './databasetype.enum';
import { DatabaseFactory } from './database.factory';

export interface QueryPlanResult {
  query: string;
  databaseType: DatabaseType;
  plan: any;
  estimatedRows?: number;
  estimatedCost?: number;
  tableScans: string[];
  missingIndexes: string[];
  suggestions: string[];
}

export interface IndexingRecommendation {
  table: string;
  columns: string[];
  type: 'BTREE' | 'HASH' | 'FULLTEXT';
  estimatedImpact: 'high' | 'medium' | 'low';
  reason: string;
  estimatedRows?: number;
}

@Injectable()
export class QueryAnalyzerService {
  private readonly logger = new Logger(QueryAnalyzerService.name);

  generateExplainQuery(query: string, dbType: DatabaseType): string {
    switch (dbType) {
      case DatabaseType.MSSQL:
        return `SET SHOWPLAN_XML ON; ${query}; SET SHOWPLAN_XML OFF;`;
      case DatabaseType.PostgreSQL:
      case DatabaseType.H2Database:
        return `EXPLAIN (ANALYZE false, FORMAT JSON) ${query}`;
      case DatabaseType.MySQL:
      case DatabaseType.MariaDB:
        return `EXPLAIN FORMAT=JSON ${query}`;
      case DatabaseType.Oracle:
        return `EXPLAIN PLAN FOR ${query}`;
      case DatabaseType.IBMDb2:
        return `EXPLAIN ALL WITH SNAPSHOT FOR ${query}`;
      case DatabaseType.Firebird:
        return `EXPLAIN PLAN FOR ${query}`;
      default:
        return `EXPLAIN ${query}`;
    }
  }

  analyzePlan(
    query: string,
    dbType: DatabaseType,
    planResult: any,
  ): QueryPlanResult {
    const tableScans: string[] = [];
    const missingIndexes: string[] = [];
    const suggestions: string[] = [];
    const planStr = JSON.stringify(planResult || '').toLowerCase();

    if (planStr.includes('seq scan') || planStr.includes('table scan') || planStr.includes('full scan')) {
      const scanMatch = planStr.match(/(\w+)\s*(?:seq scan|table scan|full scan)/i);
      tableScans.push(scanMatch?.[1] || 'unknown table');
      suggestions.push('Add indexes to avoid sequential scans');
      missingIndexes.push('Missing index on table(s) with sequential scans');
    }

    if (planStr.includes('sort') && !planStr.includes('index')) {
      suggestions.push('Consider adding an index on ORDER BY columns to avoid sort operations');
    }

    if (planStr.includes('temp') || planStr.includes('temporary')) {
      suggestions.push('Query uses temporary tables — consider optimizing joins or adding indexes');
    }

    if (planStr.includes('nested loop') && !planStr.includes('index')) {
      suggestions.push('Nested loop join without index — add index on join columns');
    }

    const costMatch = planStr.match(/"total_cost"\s*:\s*([\d.]+)/);
    const rowMatch = planStr.match(/"plan_rows"\s*:\s*(\d+)/);

    let rowMatch2 = planResult?.rows || planResult?.estimatedRows;
    if (!rowMatch2) {
      const rr = planStr.match(/"rows"\s*:\s*(\d+)/);
      rowMatch2 = rr ? parseInt(rr[1]) : undefined;
    }

    if (suggestions.length === 0) {
      suggestions.push('Query plan looks efficient — no major issues detected');
    }

    return {
      query,
      databaseType: dbType,
      plan: planResult,
      estimatedRows: rowMatch2 || (rowMatch ? parseInt(rowMatch[1]) : undefined),
      estimatedCost: costMatch ? parseFloat(costMatch[1]) : undefined,
      tableScans,
      missingIndexes,
      suggestions,
    };
  }

  generateIndexingRecommendations(analysis: QueryPlanResult): IndexingRecommendation[] {
    const recommendations: IndexingRecommendation[] = [];

    for (const table of analysis.tableScans) {
      recommendations.push({
        table,
        columns: ['id'],
        type: 'BTREE',
        estimatedImpact: 'high',
        reason: `Sequential scan detected on "${table}" — adding an index could significantly improve query performance`,
      });
    }

    if (analysis.tableScans.length > 0) {
      recommendations.push({
        table: analysis.tableScans[0],
        columns: ['created_at', 'updated_at'],
        type: 'BTREE',
        estimatedImpact: 'medium',
        reason: 'Add indexes on date columns used in ORDER BY or WHERE clauses',
      });
    }

    return recommendations;
  }
}
