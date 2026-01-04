export interface IReportExporter {
  export(data: any[]): Promise<Buffer>;
}
