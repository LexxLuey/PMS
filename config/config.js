const firebase = require('firebase');
const firebaseConfig = {
    apiKey: "AIzaSyBL-SaWMiKFdDELWCiLFWAmKQ5fuV8ej2E",
    authDomain: "pms-node.firebaseapp.com",
    databaseURL: "https://pms-node-default-rtdb.firebaseio.com",
    projectId: "pms-node",
    storageBucket: "pms-node.appspot.com",
    messagingSenderId: "404230563201",
    appId: "1:404230563201:web:0e0428c7fa2715063ab480",
    measurementId: "G-BY9DRHEW96"
  };
firebase.initializeApp(firebaseConfig)
const db = firebase.firestore()
const Product = db.collection('Products')
  
module.exports = Product
