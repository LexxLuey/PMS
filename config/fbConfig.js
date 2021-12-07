const fs = require('firebase-admin');

const serviceAccount = require('../permission.json');

fs.initializeApp({
 credential: fs.credential.cert(serviceAccount)
});

const db = fs.firestore();

module.exports = db