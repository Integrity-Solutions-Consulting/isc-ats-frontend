import type { SpreadsheetExporter } from './spreadsheet';

export const excelJsExporter: SpreadsheetExporter = {
  async export(report) {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = report.company;
    workbook.created = report.generatedAt;
    const sheet = workbook.addWorksheet('Postulantes', {
      views: [{ state: 'frozen', ySplit: 7, xSplit: 1, showGridLines: false }],
      pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    sheet.columns = report.columns.map((column) => ({ width: column.width }));
    sheet.mergeCells('A1:A5');
    const logo = workbook.addImage({ base64: report.logo, extension: 'png' });
    sheet.addImage(logo, { tl: { col: 0.15, row: 0.5 }, ext: { width: 195, height: 75 } });
    const heading = (row: number, text: string, size: number) => {
      sheet.mergeCells(row, 2, row, report.columns.length);
      const cell = sheet.getCell(row, 2);
      cell.value = text;
      cell.font = { name: 'Calibri', size, bold: row < 3, color: { argb: 'FF1F4898' } };
      cell.alignment = { vertical: 'middle', wrapText: true };
      sheet.getRow(row).height = row === 2 ? 36 : 24;
    };
    heading(1, report.company, 18);
    heading(2, report.title, 15);
    heading(3, `Cliente: ${report.client}`, 11);
    heading(4, `Postulantes exportados: ${report.rows.length}`, 11);
    heading(5, `Generado: ${report.generatedAt.toLocaleString('es-EC')}`, 10);
    const header = sheet.getRow(7);
    header.values = report.columns.map((column) => column.title);
    header.height = 34;
    header.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4898' } };
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    for (const values of report.rows) {
      const row = sheet.addRow(values);
      // Accommodate long knowledge/tool lists rather than clipping them.
      const lines = values.reduce<number>((max, value, index) => {
        if (typeof value !== 'string') return max;
        return Math.max(max, ...value.split('\n').map((line) => Math.ceil(line.length / (report.columns[index].width - 2))));
      }, 1);
      row.height = Math.min(409, Math.max(32, lines * 15 + 8));
      row.eachCell((cell, index) => {
        cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF1A2332' } };
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: row.number % 2 === 0 ? 'FFF1F3F6' : 'FFFFFFFF' } };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E5EB' } } };
        const format = report.columns[index - 1].format;
        if (format && typeof cell.value !== 'string') cell.numFmt = format;
        if (cell.type === ExcelJS.ValueType.Hyperlink) {
          cell.font = { name: 'Calibri', size: 11, underline: true, color: { argb: 'FF1F4898' } };
        }
      });
    }
    sheet.autoFilter = { from: { row: 7, column: 1 }, to: { row: sheet.rowCount, column: report.columns.length } };
    sheet.pageSetup.printTitlesRow = '1:7';
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([new Uint8Array(buffer)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },
};
