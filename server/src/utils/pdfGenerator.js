const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const CERTS_DIR = path.join(__dirname, '../../certificates');

function generateCertificate({ userName, courseName, score, date, attemptId }) {
  const filename = `cert_${attemptId}.pdf`;
  const outputPath = path.join(CERTS_DIR, filename);

  const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 72, right: 72 }
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const W = doc.page.width;
  const H = doc.page.height;

  // Background gradient (simulated with rectangles)
  doc.rect(0, 0, W, H).fill('#0f172a');

  // Decorative border
  doc.rect(20, 20, W - 40, H - 40)
    .lineWidth(3)
    .stroke('#f59e0b');

  doc.rect(28, 28, W - 56, H - 56)
    .lineWidth(1)
    .stroke('#fbbf24');

  // Header accent bar
  doc.rect(72, 60, W - 144, 6).fill('#f59e0b');

  // Title
  doc.font('Helvetica-Bold')
    .fontSize(42)
    .fillColor('#f8fafc')
    .text('CERTIFICADO DE APROBACIÓN', 0, 90, { align: 'center' });

  // Subtitle line
  doc.rect(72, 148, W - 144, 2).fill('#334155');

  // "Se certifica que" text
  doc.font('Helvetica')
    .fontSize(16)
    .fillColor('#94a3b8')
    .text('Se certifica que', 0, 168, { align: 'center' });

  // Student name
  doc.font('Helvetica-Bold')
    .fontSize(36)
    .fillColor('#f59e0b')
    .text(userName, 0, 200, { align: 'center' });

  // Description
  doc.font('Helvetica')
    .fontSize(16)
    .fillColor('#cbd5e1')
    .text('ha completado satisfactoriamente el curso de capacitación:', 0, 254, { align: 'center' });

  // Course name
  doc.font('Helvetica-Bold')
    .fontSize(26)
    .fillColor('#f8fafc')
    .text(courseName, 72, 286, { align: 'center', width: W - 144 });

  // Score badge
  const badgeY = 345;
  doc.roundedRect(W / 2 - 80, badgeY, 160, 44, 22).fill('#1e40af');
  doc.font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('#f8fafc')
    .text(`Calificación: ${score}%`, W / 2 - 80, badgeY + 12, { width: 160, align: 'center' });

  // Bottom divider
  doc.rect(72, H - 120, W - 144, 1).fill('#334155');

  // Date and signature area
  doc.font('Helvetica')
    .fontSize(12)
    .fillColor('#94a3b8')
    .text(`Fecha de aprobación: ${date}`, 100, H - 108, { width: 250 });

  // Signature line right side
  doc.moveTo(W - 260, H - 78).lineTo(W - 100, H - 78).stroke('#64748b');
  doc.font('Helvetica')
    .fontSize(11)
    .fillColor('#94a3b8')
    .text('Firma Autorizada', W - 260, H - 68, { width: 160, align: 'center' });

  // Footer
  doc.font('Helvetica')
    .fontSize(9)
    .fillColor('#475569')
    .text(`ID de verificación: ${attemptId}`, 0, H - 40, { align: 'center' });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
}

module.exports = { generateCertificate };
