// διαχείριση διαδρομών αρχείων
const path = require('node:path');

// 6. Ρυθμίσεις host/port 
const HOST = process.env.HOST || '0.0.0.0';
const parsedPort = Number.parseInt(
    process.env.PORT || '3000',
    10
);
const PORT =
    Number.isInteger(parsedPort) &&
    parsedPort > 0 &&
    parsedPort < 65536
        ? parsedPort
        : 3000;

// Διαδρομές για static αρχεία
const publicDir = path.join(__dirname, '..', 'public');
const clientDistDir = path.join(
    __dirname,
    '..',
    'client',
    'dist'
);
// για τα WebSockets
const REALTIME_WS_PATH = '/ws/realtime';

module.exports = {
    HOST,
    PORT,
    publicDir,
    clientDistDir,
    REALTIME_WS_PATH
};