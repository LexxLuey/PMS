
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
const API_KEY = 'AIzaSyAn6kt2uVcLjL71xdAFz7gtNmrhHOPukZk'
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

       // products.get().then((querySnapshot) => {
        //     const tempDoc = querySnapshot.docs.map((doc) => {
        //       return { id: doc.id, ...doc.data() }
        //     })
        //     console.log(tempDoc)

        // })
        
        res.render("products", {
            user: req.user,
            products: listProducts,
        });
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }

});


// SHOW ADD USER FORM
router.get('/create', function(req, res, next) {
    // render to views/user/add.ejs
    res.render('products-create', {
        user: req.user
    })
})


// ADD NEW USER POST ACTION
router.post('/adding', upload.single('image'), async function(req, res) {
    // console.log(req.body.product_name);
    // return res.status(200).send(JSON.stringify(req.body));  
    try {
        // Add a new document with a generated id.
        let filename = req.file.filename;
        // return res.status(200).json({ name: filename });
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

        currDate = new Date();
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
        
        
            /*let messageRef = await db
            .collection("products").doc(product.id)
            .collection("comments").add({
                comment: "Hey",
                user: "JD"
            }); */

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


router.get('/product/:id', async function(req, res) {

    try {
        // get document
        const product = await db.collection('products').doc(req.params.id).get();
        
        var prod = {} ;
        if (!product.exists) {
            console.log('No document');
            return res.status(500).send();
        } else {
           
            prod = { id: product.id, ...product.data() };
            // comm = { id: comments.id, ...comments.data() };
            console.log('Got document with ID: ', product.id);
            console.log('Got document: ', prod);
            
        }

        var listComments = [];
        const comments = await db.collection('products').doc(req.params.id).collection("comments").get()
            .then(querySnapshot => {    
                querySnapshot.forEach(doc => {        
                    console.log(doc.id, " => ", doc.data());   
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


router.get('/update/:id', async function(req, res) {

    try {
        // get document
        const product = await db.collection('products').doc(req.params.id).get();
        
        if (!product.exists) {
            console.log('No document');
            return res.status(500).send();
        } 
        var prod = {} ;
        prod = { id: product.id, ...product.data() };
        console.log('Got document with ID: ', product.id);
        console.log('Got document: ', prod.id);

        res.render("product", {
            user: req.user,
            product: prod,
        });  
    } catch (error) {
        console.log(error);
        return res.status(500).send(error);
    }

})


router.post('/update/:id', upload.single('image'), async function(req, res) {
    // console.log(req.body.product_name);
    // return res.status(200).send(JSON.stringify(req.body));  
    try {
        // Add a new document with a generated id.
        let filename = req.file.filename;
        // return res.status(200).json({ name: filename });

        currDate = new Date();
        const product = await db.collection('products').doc(req.params.id).set({
            name: req.body.product_name,
            image: filename,
            geo_details: req.body.geo_details,
            user: req.user.name,
            modified_on: currDate,
            location: req.body.location
        });
        
        
            /*let messageRef = await db
            .collection("products").doc(product.id)
            .collection("comments").add({
                comment: "Hey",
                user: "JD"
            }); */

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

router.get('/delete/:id', async function(req, res) {
    // get collection
    const product = await db.collection('products').doc(req.params.id).delete(); 

    await res.redirect('/products'); 
    
});


router.post('/comment/:id', async function(req, res) {

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
        // console.log('Got document with ID: ', product.id);
        // console.log('Got document: ', prod.id);

        console.log('comment: ', dbComment.id);
        let ownerProduct = {};
        ownerProduct = await User.find({ "name": prod.user });
        // console.log('Got user: ', ownerProduct[0].email)

        const Email = require('email-templates');
        const email = new Email({
            message: {
                from: 'tradedepot@gmail.com'
            },
            send: true,
            transport: {
                host: 'smtp.mailtrap.io',
                port: 2525,
                ssl: false,
                tls: true,
                auth: {
                    user: '712f61f1f9d44b', // your Mailtrap username
                    pass: 'f7790be06598f0' //your Mailtrap password
                }
            }
        });
        var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
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



















/* GET home page. */
router.get('/products', ensureAuthenticated, async function(req, res) {
    User.find((err, docs) => {
       if (!err) {
           const products = db.collection('products').get();

           console.log('products: ', products);

           
           res.render("products", {
               user: req.user,
               products: products,
               users: docs
       });
       } else {
           console.log('Failed to retrieve the Users List: ' + err);
       }
   });
});

// ADD NEW USER POST ACTION
router.post('/add', function(req, res, next) {
    req.assert('name', 'Name is required').notEmpty() //Validate name
    req.assert('email', 'A valid email is required').isEmail() //Validate email
    var errors = req.validationErrors()
    if (!errors) { //No errors were found.  Passed Validation!
        var product = new Product({
        name: req.body.name,
        email: req.body.email,
    });
        product.save((err, doc) => {
            if (!err){
                req.flash('success', 'User added successfully!');
                res.redirect('/users');
            }else{
                res.render('users/add', {
                title: 'Add New User',
                name: user.name,
                email: user.email
            })}
        });
    } else { //Display errors to user
        var error_msg = ''
        errors.forEach(function(error) {
            error_msg += error.msg + '<br>'
        })
        req.flash('error', error_msg)
        res.render('users/add', {
            title: 'Add New User',
            name: req.body.name,
            email: req.body.email
        })
    }
})


router.get('/reading', async function(req, res) {
    // get collection
    const products = await db.collection('products').get();

    console.log('products: ', products);
    res.render("products", {
        user: req.user,
        products: products,
    });
    
});


module.exports = router;