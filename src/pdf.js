// sprzedamfakture.pl — PDF-documenten (pdfkit) met Lato (OFL, assets/fonts): volledige Poolse tekenset.
//
// render(blocks, meta) → Buffer. Blokken: { type: 'title'|'sub'|'h'|'p'|'li'|'small'|'sig'|'break', text, left, right }
// De tekst komt uit src/deals.js (umowa przelewu, zawiadomienie) zodat dezelfde blokken ook als HTML te tonen zijn.
const path = require('path');
const fs = require('fs');
let PDFDocument = null;
try { PDFDocument = require('pdfkit'); } catch { PDFDocument = null; }

const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts');
const FONTS = { R: path.join(FONT_DIR, 'Lato-Regular.ttf'), B: path.join(FONT_DIR, 'Lato-Bold.ttf') };
function available() { return !!PDFDocument && fs.existsSync(FONTS.R) && fs.existsSync(FONTS.B); }

const PAGE = { width: 595.28, height: 841.89 };
const M = { top: 64, bottom: 64, left: 60, right: 60 };
const W = PAGE.width - M.left - M.right;

function render(blocks, meta = {}) {
  if (!available()) return Promise.reject(new Error('PDF niet beschikbaar (pdfkit of lettertypen ontbreken)'));
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: M, bufferPages: true, info: { Title: meta.title || 'Dokument', Author: meta.author || 'sprzedamfakture.pl', Creator: 'sprzedamfakture.pl' } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.registerFont('R', FONTS.R);
    doc.registerFont('B', FONTS.B);
    const body = () => doc.font('R').fontSize(10.5).fillColor('#111');
    for (const b of blocks || []) {
      const text = String(b.text == null ? '' : b.text);
      switch (b.type) {
        case 'title': doc.font('B').fontSize(15).fillColor('#12243d').text(text, { align: 'center' }); doc.moveDown(0.3); break;
        case 'sub': doc.font('R').fontSize(9.5).fillColor('#555').text(text, { align: 'center' }); doc.moveDown(0.8); break;
        case 'h': doc.moveDown(0.5); doc.font('B').fontSize(11).fillColor('#12243d').text(text); doc.moveDown(0.25); break;
        case 'p': body().text(text, { align: 'justify', lineGap: 1.5 }); doc.moveDown(0.45); break;
        case 'li': body().text(text, { align: 'justify', lineGap: 1.5, indent: 0, paragraphGap: 0 }); doc.moveDown(0.25); break;
        case 'small': doc.font('R').fontSize(8.5).fillColor('#555').text(text, { align: 'left', lineGap: 1 }); doc.moveDown(0.4); break;
        case 'sig': {
          // twee handtekeningvakken naast elkaar; op een nieuwe pagina als er geen ruimte meer is
          if (doc.y > PAGE.height - M.bottom - 130) doc.addPage();
          doc.moveDown(1.4);
          const y = doc.y, colW = (W - 30) / 2;
          let blockH = 0;
          const col = (x, label, name) => {
            doc.font('R').fontSize(9).fillColor('#555').text(label, x, y, { width: colW, lineBreak: false });
            doc.font('R').fontSize(10.5).fillColor('#111').text('______________________________', x, y + 44, { width: colW, lineBreak: false });
            doc.font('R').fontSize(9).fillColor('#333');
            const h = doc.heightOfString(name || ' ', { width: colW });
            doc.text(name || '', x, y + 58, { width: colW });
            doc.font('R').fontSize(8.5).fillColor('#777').text('data, podpis', x, y + 58 + h + 3, { width: colW, lineBreak: false });
            blockH = Math.max(blockH, 58 + h + 16);
          };
          col(M.left, b.leftLabel || 'Cedent', b.left);
          col(M.left + colW + 30, b.rightLabel || 'Cesjonariusz', b.right);
          doc.x = M.left; doc.y = y + blockH + 8;
          break;
        }
        case 'break': doc.addPage(); break;
        default: body().text(text); doc.moveDown(0.4);
      }
    }
    // voettekst met paginanummer
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      // in de ondermarge schrijven zonder dat pdfkit een nieuwe pagina begint: ondermarge tijdelijk op 0
      const keep = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.font('R').fontSize(8).fillColor('#888').text((meta.footer || 'sprzedamfakture.pl') + ' · strona ' + (i + 1) + ' / ' + range.count, M.left, PAGE.height - 40, { width: W, align: 'center', lineBreak: false });
      doc.page.margins.bottom = keep;
    }
    doc.end();
  });
}

module.exports = { render, available };
