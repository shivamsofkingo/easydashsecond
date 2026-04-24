// const crypto = require("crypto");
// require("dotenv").config();

// const key1 = crypto.randomBytes(32).toString("hex");
// const key2 = crypto.randomBytes(32).toString("hex");
// console.table({key1, key2});
// const iv = crypto.randomBytes(16).toString("hex");

// console.log("ENCRYPTION_KEY =", key);
// console.log("ENCRYPTION_IV =", iv);

// const algorithm = "aes-256-cbc";
// const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
// const iv = Buffer.from(process.env.ENCRYPTION_IV, "hex");

// function encryptMessage(message) {
//     const cipher = crypto.createCipheriv(algorithm, key, iv);
//     let encrypted = cipher.update(message, "utf8", "hex");
//     encrypted += cipher.final("hex");
//     return encrypted;
// }

// function decryptMessage(encryptedMessage) {
//     const decipher = crypto.createDecipheriv(algorithm, key, iv);
//     let decrypted = decipher.update(encryptedMessage, "hex", "utf8");
//     decrypted += decipher.final("utf8");
//     return decrypted;
// }

// module.exports = { encryptMessage, decryptMessage };