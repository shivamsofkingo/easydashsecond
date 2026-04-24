const crypto = require('crypto');
const generateQRCode = () => {

    const algorithm = 'aes-256-cbc';
    const secretKey = process.env.QR_SECRET || 'your-32-character-secret-key!!'; // Must be 32 bytes
    const key = crypto.scryptSync(secretKey, 'salt', 32);  // Derive key
    const iv = crypto.randomBytes(16);  // Initialization vector

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let qr_code_data = cipher.update(qrPayload, 'utf8', 'hex');
    qr_code_data += cipher.final('hex');

    // Store IV with encrypted data (needed for decryption)
    const encryptedData = iv.toString('hex') + ':' + qr_code_data;

    console.log('Encrypted QR Data:', encryptedData);
}
modules.exports = generateQRCode;