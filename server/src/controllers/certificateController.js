const fs = require('fs');
const { getDb } = require('../config/database');
const { CERTS_DIR } = require('../config/paths');

function listCertificates(req, res) {
  const db = getDb();
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user.id;

  const certs = db.prepare(`
    SELECT cert.id, cert.issued_at, cert.pdf_filename,
      c.title as course_title,
      u.name as user_name,
      qa.score
    FROM certificates cert
    JOIN courses c ON c.id = cert.course_id
    JOIN users u ON u.id = cert.user_id
    JOIN quiz_attempts qa ON qa.id = cert.attempt_id
    WHERE cert.user_id = ?
    ORDER BY cert.issued_at DESC
  `).all(userId);

  res.json(certs);
}

function downloadCertificate(req, res) {
  const db = getDb();
  const cert = db.prepare(`
    SELECT cert.*, u.name as user_name, c.title as course_title
    FROM certificates cert
    JOIN users u ON u.id = cert.user_id
    JOIN courses c ON c.id = cert.course_id
    WHERE cert.id = ?
  `).get(req.params.id);

  if (!cert) return res.status(404).json({ error: 'Certificado no encontrado' });

  // Students can only download their own certificates
  if (req.user.role !== 'admin' && cert.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const filePath = path.join(CERTS_DIR, cert.pdf_filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo no encontrado' });

  const safeName = `Certificado_${cert.user_name.replace(/\s+/g, '_')}_${cert.course_title.replace(/\s+/g, '_')}.pdf`;
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  res.setHeader('Content-Type', 'application/pdf');
  fs.createReadStream(filePath).pipe(res);
}

module.exports = { listCertificates, downloadCertificate };
