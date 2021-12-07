const express = require('express');
const router = express.Router();
const db = require('../config/fbConfig');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const key = process.env.GOOGLE_API_KEY
const NodeGeocoder = require('node-geocoder');
const API_KEY = 'AIzaSyAn6kt2uVcLjL71xdAFz7gtNmrhHOPukZk'
const axios = require('axios');
const haversine = require('haversine-distance');
var nodemailer = require('nodemailer');
// const { computeOffset } = require ('spherical-geometry-js');





// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => {
  res.render('welcome');
}) 

router.get('/test', async (req, res) => {
  try {
    async function geocode(address) {
      console.log(`Getting result for address ${address}...`);
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURI(address)}&key=${API_KEY}`)
      return response.data.results[0];
    }

    async function testGeocode(input) {
        const address = input;
        const result = await geocode(address);
        console.log("Latitude:", result.geometry.location.lat);
        console.log("Longitude:", result.geometry.location.lng);
        const { lat, lng } = result.geometry.location;
        // Go 100 meters north
        // console.log("Compute offset result:", JSON.stringify(computeOffset({ lat, lng }, 100, 0)));
        console.log("Complete result:", result)
        return result;
    };

    // var transport = nodemailer.createTransport({
    //     host: "smtp.mailtrap.io",
    //     port: 2525,
    //     auth: {
    //         user: "712f61f1f9d44b",
    //         pass: "f7790be06598f0"
    //     }   
    // });

    // var mailOptions = {
    //     from: '"Example Team" <from@example.com>',
    //     to: 'user1@example.com, user2@example.com',
    //     subject: 'Nice Nodemailer test',
    //     text: 'Hey there, it’s our first message sent with Nodemailer ;) ',
    //     html: '<b>Hey there! </b><br> This is our first message sent with Nodemailer'
    // };

    // transport.sendMail(mailOptions, (error, info) => {
    //     if (error) {
    //         return console.log(error);
    //     }
    //     console.log('Message sent: %s', info.messageId);
    // });

    // const Email = require('email-templates');
    // const email = new Email({
    // message: {
    //   from: 'tradedepot@gmail.com'
    // },
    // send: true,
    // transport: {
    //   host: 'smtp.mailtrap.io',
    //   port: 2525,
    //   ssl: false,
    //   tls: true,
    //   auth: {
    //     user: '712f61f1f9d44b', // your Mailtrap username
    //     pass: 'f7790be06598f0' //your Mailtrap password
    //   }
    // }
    // });

    // const people = [
    // {firstName: 'Diana', lastName: 'One'},
    // {firstName: 'Alex', lastName: 'Another'}
    // ];

    // people.forEach((person) => {
    // email
    //   .send({
    //     template: 'comment',
    //     message: {
    //       to: 'test@example.com'
    //     },
    //     locals: person
    //   })
    //   .then(console.log)
    //   .catch(console.error);
    // })
  //   var user_data = await testGeocode("Plot 756 FHA Lugbe, Abuja, FCT");
  //   var product_data = await testGeocode("No 31 Pope John Paul Street Maitama");

  // let user_lng = await user_data.geometry.location.lng;
  // let user_lat = await user_data.geometry.location.lat;
  // let product_lng = await product_data.geometry.location.lng;
  // let product_lat = await product_data.geometry.location.lat;

  // // console.log("lng i made: ", lngtit);
  // const user_base = { latitude: user_lat, longitude: user_lng };
  // const product_base = { latitude: product_lat, longitude: product_lng };
  // let distance = haversine(user_base, product_base);
  // distance = distance/1000;
  // console.log('Distance in KM:   ',distance.toFixed(2) ) ;
  
  return res.status(200).send('Good');

   
  } catch (error) {
     console.log(error);
     return res.status(200).send();
  }


});

// Dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    async function geocode(address) {
      // console.log(`Getting result for address ${address}...`);
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURI(address)}&key=${API_KEY}`)
      return response.data.results[0];
    }

    async function testGeocode(input) {
        const address = input;
        const result = await geocode(address);
        // console.log("Latitude:", result.geometry.location.lat);
        // console.log("Longitude:", result.geometry.location.lng);
        const { lat, lng } = result.geometry.location;
        // Go 100 meters north
        // console.log("Compute offset result:", JSON.stringify(computeOffset({ lat, lng }, 100, 0)));
        // console.log("Complete result:", result)
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

        // console.log("lng i made: ", lngtit);
        const user_base = { latitude: user_lat, longitude: user_lng };
        const product_base = { latitude: product_lat, longitude: product_lng };
        let distance = haversine(user_base, product_base);
        distance = distance/1000;
        // console.log('Distance in KM:   ',distance.toFixed(2) ) ;
        
        if (!req.query.reach) {
          range = 50;
        } else {
          range = parseInt(req.query.reach);
        }

        if (distance <= range) {
          listProducts.push(product); 
        } 
        
    });
    console.log('range:   ', parseInt(req.query.reach) )

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
