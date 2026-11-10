// @vitest-environment node
import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { excelJsExporter } from './excelJsExporter';

describe('ExcelJS adapter', () => {
  it('writes a readable XLSX with branding, safe text, numeric formats, hyperlinks and frozen filters', async () => {
    const blob = await excelJsExporter.export({
      company: 'Integrity Solutions', title: 'Postulantes · Developer', client: 'Cliente', generatedAt: new Date('2026-11-09'),
      logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      columns: [{ title: 'Nombre', width: 34 }, { title: 'Match', width: 20, format: '0%' }, { title: 'CV', width: 20 }],
      rows: [['=HYPERLINK("https://example.com")', 0.85, { text: 'Ver CV', hyperlink: 'https://empleos.example.com/api/candidate/cv/1?view=1' }]],
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await blob.arrayBuffer());
    const sheet = workbook.getWorksheet('Postulantes')!;
    expect(sheet.getCell('B1').value).toBe('Integrity Solutions');
    expect(sheet.getCell('B3').value).toBe('Cliente: Cliente');
    expect(sheet.getCell('A8').type).toBe(ExcelJS.ValueType.String);
    expect(sheet.getCell('B8').value).toBe(0.85);
    expect(sheet.getCell('B8').numFmt).toBe('0%');
    expect(sheet.getCell('C8').value).toMatchObject({ text: 'Ver CV', hyperlink: expect.stringContaining('?view=1') });
    expect(sheet.getImages()).toHaveLength(1);
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 7 });
    expect(sheet.autoFilter).toBe('A7:C8');
  });
});
