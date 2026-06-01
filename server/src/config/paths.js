const path = require('path');

const serverRoot = path.join(__dirname, '../..');
const base = process.env.DATA_DIR || serverRoot;

module.exports = {
  DB_PATH:     process.env.DATA_DIR
    ? path.join(base, 'lms.db')
    : path.join(serverRoot, 'data', 'lms.db'),
  UPLOADS_DIR: path.join(base, 'uploads'),
  CERTS_DIR:   path.join(base, 'certificates'),
};
