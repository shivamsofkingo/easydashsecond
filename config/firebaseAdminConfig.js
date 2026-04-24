const admin = require('firebase-admin');
// const serviceAccount = require("../serviceAccount.json");
const serviceAccount = require("../serviceAccountNew.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;