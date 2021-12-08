const express = require('express');
const router = express.Router();
const db = require('../config/fbConfig');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const NodeGeocoder = require('node-geocoder');
const API_KEY = process.env.GOOGLE_API_KEY
const axios = require('axios');
const haversine = require('haversine-distance');
var nodemailer = require('nodemailer');



// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => {
  res.render('welcome');
}) 

// Dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    async function geocode(address) {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURI(address)}&key=${API_KEY}`)
      return response.data.results[0];
    }

    async function testGeocode(input) {
        const address = input;
        const result = await geocode(address);
        const { lat, lng } = result.geometry.location;
        return result;
    };
    var user_data = await testGeocode(req.user.address);
    

    let user_lng = await user_data.geometry.location.lng;
    let user_lat = await user_data.geometry.location.lat;

    const products = db.collection('products');
    const snapshot = await products.get();
    var listProducts = [];
    let range = 0
    snapshot.forEach(doc => {
        var product = {} ;
        product = { id: doc.id, ...doc.data() };

        let product_lng = product.longitude;
        let product_lat = product.latitude;

        const user_base = { latitude: user_lat, longitude: user_lng };
        const product_base = { latitude: product_lat, longitude: product_lng };
        let distance = haversine(user_base, product_base);
        distance = distance/1000;
        
        if (!req.query.reach) {
          range = 50;
        } else {
          range = parseInt(req.query.reach);
        }

        if (distance <= range) {
          listProducts.push(product); 
        } 
        
    });

    reach = {value: range};

    res.render('dashboard', {
      user: req.user,
      products: listProducts,
      reach: reach
    })

  } catch (error) {
      console.log(error);
      return res.status(400).send(JSON.stringify(error));
  }

}
  
);

module.exports = router;
