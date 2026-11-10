/** Library-independent report contract. Keep ExcelJS types inside its adapter. */
export type SpreadsheetValue = string | number | Date | { text: string; hyperlink: string };

export interface SpreadsheetReport {
  company: string;
  title: string;
  client: string;
  generatedAt: Date;
  logo: string; // PNG data URL
  columns: { title: string; width: number; format?: string }[];
  rows: SpreadsheetValue[][];
}

export interface SpreadsheetExporter {
  export(report: SpreadsheetReport): Promise<Blob>;
}

export async function exportSpreadsheet(report: SpreadsheetReport): Promise<Blob> {
  // This is the only selection point to replace the spreadsheet library.
  const { excelJsExporter } = await import('./excelJsExporter');
  return excelJsExporter.export(report);
}
