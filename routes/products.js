
const express = require('express');
// const Product = require('../models/Product');
const User = require('../models/User');
const db = require('../config/fbConfig');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const upload = require('../config/uploadMiddleware');
const Resize = require('../services/Resize.js');
const path = require('path');
const multer = require('multer');
const API_KEY = process.env.GOOGLE_API_KEY
const axios = require('axios');
var nodemailer = require('nodemailer');


// Dashboard
router.get('/', ensureAuthenticated, async function(req, res) {
    try {
        const products = db.collection('products');
        const snapshot = await products.where('user', '==', req.user.name).get();
        var listProducts = [];
       
        snapshot.forEach(doc => {
            var prod = {} ;
            prod = { id: doc.id, ...doc.data() };
            listProducts.push(prod); 
        });
        
        res.render("products", {
            user: req.user,
            products: listProducts,
        });
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }

});


// SHOW ADD PRODUCT FORM
router.get('/create', ensureAuthenticated, async function(req, res, next) {
    // render to views/user/add.ejs
    res.render('products-create', {
        user: req.user
    })
})


// ADD NEW Product POST ACTION
router.post('/adding', upload.single('image'), ensureAuthenticated, async function(req, res) {

    try {
        // Add a new document with a generated id.
        let filename = req.file.filename;

        async function geocode(address) {
            console.log(`Getting result for address ${address}...`);
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURI(address)}&key=${API_KEY}`)
            return response.data.results[0];
        }

        async function testGeocode(input_address) {
            const address = input_address;
            const result = await geocode(address);
            console.log("Latitude:", result.geometry.location.lat);
            console.log("Longitude:", result.geometry.location.lng);
            const { lat, lng } = result.geometry.location;
            // Go 100 meters north
            // console.log("Compute offset result:", JSON.stringify(computeOffset({ lat, lng }, 100, 0)));
            console.log("Complete result:", result)
            return result;
        };
        var user_data = await testGeocode(req.body.location);

        let user_lng = await user_data.geometry.location.lng;
        let user_lat = await user_data.geometry.location.lat;

        let currDate = new Date();

        const product = await db.collection('products').add({
            name: req.body.product_name,
            image: filename,
            latitude: user_lat,
            longitude: user_lng,
            user: req.user.name,
            user_id: req.user.id,
            date: currDate,
            location: req.body.location
        });
        
        console.log('Added document with ID: ', product.id);

        req.flash(
            'success_msg',
            'You created a new Product'
        );

        res.redirect('/products');   

    } catch (error) {
        console.log(error);
        return res.status(500).send(error);
    }

})


router.get('/product/:id', ensureAuthenticated, async function(req, res) {

    try {
        // get document
        const product = await db.collection('products').doc(req.params.id).get();
        
        var prod = {} ;
        if (!product.exists) {
            console.log('No document');
            return res.status(500).send();
        } else {
            prod = { id: product.id, ...product.data() };            
        }

        var listComments = [];
        const comments = await db.collection('products').doc(req.params.id).collection("comments").get()
            .then(querySnapshot => {    
                querySnapshot.forEach(doc => {        
                    var prod = {} ;
                    prod = { id: doc.id, ...doc.data() };
                    listComments.push(prod); 
                });
            },()=>{
                console.log("Nothing");
            });
        return res.render("product-view", {
                user: req.user,
                product: prod,
                comments: listComments
            }); 
    } catch (error) {
        console.log(error);
        return res.status(500).send(error);
    }

})


router.get('/update/:id', ensureAuthenticated, async function(req, res) {

    try {
        // get document
        const product = await db.collection('products').doc(req.params.id).get();
        
        if (!product.exists) {
            console.log('No document');
            return res.status(500).send();
        } 
        var prod = {} ;
        prod = { id: product.id, ...product.data() };

        res.render("product", {
            user: req.user,
            product: prod,
        });  
    } catch (error) {
        console.log(error);
        return res.status(500).send(error);
    }

})


router.post('/update/:id', upload.single('image'), ensureAuthenticated, async function(req, res) {

    try {
        // Add a new document with a generated id.
        let filename = req.file.filename;

        let currDate = new Date();
        const product = await db.collection('products').doc(req.params.id).set({
            name: req.body.product_name,
            image: filename,
            geo_details: req.body.geo_details,
            user: req.user.name,
            modified_on: currDate,
            location: req.body.location
        });

        console.log('Added document with ID: ', product.id);
        req.flash(
            'success_msg',
            'You created a new Product'
        );
        res.redirect('/products');   
    } catch (error) {
        console.log(error);
        return res.status(500).send(error);
    }

})

router.get('/delete/:id', ensureAuthenticated, async function(req, res) {
    // get collection
    const product = await db.collection('products').doc(req.params.id).delete(); 

    await res.redirect('/products'); 
    
});


router.post('/comment/:id', ensureAuthenticated, async function(req, res) {

    try {
        var comment = req.body.comment;
        const dbComment = await db.collection('products').doc(req.params.id)
                            .collection("comments").add({
                                comment: comment,
                                user: req.user.name
                            });

        const product = await db.collection('products').doc(req.params.id).get();
        
        if (!product.exists) {
            console.log('No document');
            return res.status(500).send();
        } 
        var prod = {} ;
        prod = { id: product.id, ...product.data() };
;
        let ownerProduct = {};
        ownerProduct = await User.find({ "name": prod.user });

        var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

        const Email = require('email-templates');
        const email = new Email({
            message: {
                from: 'biggestluey@gmail.com'
            },
            send: true,
            transport: {
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: process.env.MAIL_USERNAME,
                    // clientId: process.env.OAUTH_CLIENTID,
                    // clientSecret: process.env.OAUTH_CLIENT_SECRET,
                    // refreshToken: process.env.OAUTH_REFRESH_TOKEN,
                    accessToken: process.env.ACCESS_TOKEN,
                }
            }
        });
        
        const people = [
            {name: ownerProduct[0].name, product: prod.name, user: req.user.name, url: fullUrl},
        ];

        people.forEach((person) => {
        email
        .send({
            template: 'comment',
            message: {
                to: ownerProduct[0].email
            },
            locals: person
        })
        .then(console.log)
        .catch(console.error);
        })

        req.flash(
            'success_msg',
            'Your comment was added successfully'
        );

        await res.redirect('/products/product/' + req.params.id);

    } catch (error) {
        console.log(error);
        return res.status(500).send(error);
    }

});


module.exports = router;