const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userModel = require('./models/userModel');
const foodModel = require('./models/foodModel');
const verifyToken = require('./verifyToken');
const trackingModel = require('./models/trackingModel');


// Load environment variables
require('dotenv').config();

// Database connection 
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("Database connection successful");
})
.catch((err) => {
    console.error("Error connecting to database:", err);
});

const app = express();

app.use(express.json());


// endpoint for registering user 

app.post("/register", (req, res) => {

    let user = req.body;

    bcrypt.genSalt(10, (err, salt) => {
        if(!err){
            bcrypt.hash(user.password, salt, async (err, hpass) => {
                if(!err){
                    user.password = hpass;
                    try {
                        let doc = await userModel.create(user);
                        res.status(201).send({message: "User Registered"})
                      } catch (error) {
                          console.log(err);
                          res.status(500).send({message: "some problem"})
                      }
                }
            })
        }
    });

    
});

// endpoint for login 
app.post('/login', async (req, res) => {

    let userCred = req.body;

    try {
        const user = await userModel.findOne({email: userCred.email});

        if(user !== null){
            bcrypt.compare(userCred.password, user.password, (err, success) => {
                if(success==true)
                {
                    jwt.sign({email: userCred.email}, "nutrifyapp", (err, token) => {
                        if(!err){
                            res.send({message: "Login success", token: token})
                        }
                    })
                } else {
                    res.status(403).send({message: "Incorrect password"})
                }
            })
        } else {
            res.status(404).send({message: "User not found"});
        }
    } catch (error) {
       console.log(error);
       res.status(500).send({message: "Some problem"});
    }

    

})

//endpoint to see all foods
app.get('/foods', verifyToken, async (req,res) => {

    try {
        let foods = await foodModel.find();
        res.send(foods);
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "some problem while getting info"});
    }

    

})

// endpoint to search food by name 

app.get('/foods/:name', verifyToken, async (req, res) => {

    try {
      let foods = await foodModel.find({name: {$regex: req.params.name, $options: "i"}});

      if(foods.length !== 0){
        res.send(foods);
      } else {
        res.status(404).send("food item not found")
      }
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "some problem occured while getting info"})
    } 
});

//endpoint to track a food.

app.post("/track", verifyToken, async (req,res) => {

    let trackData = req.body;
    try {
     let data = await trackingModel.create(trackData);

     res.status(201).send({message: "food added"});
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "some problem has occurred."})
    }
});

//endpoint to fetch all food eating by a person
app.get('/track/:userid/:date', verifyToken, async (req,res) => {

    let userid = req.params.userid;
    console.log(userid);
    let date = new Date(req.params.date);
    let strDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    console.log(date);
    console.log(strDate);
    try {
        let foods = await trackingModel.find({userId: userid, eatenDate: strDate}).populate('userId').populate('foodId');

        console.log("Query Result:", foods); // Log query result
        
        res.send(foods);
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "some problem in getting the food"})
    }
})



app.listen(8000, () => {
    console.log("Server is up and running");
});