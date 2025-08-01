const express = require('express');
const { body,validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const connection = require('../config/db');
const userModel = require('../models/users');
const authemiddleware = require('../middlewares/authenticate')
const jwt = require('jsonwebtoken');

const router = express.Router();



router.get('/',(req,res)=>{
    res.render('index')
})
router.get('/services',(req,res)=>{
    res.render('upload')
})
router.get('/register',(req,res)=>{
    res.render('register')
})


// use of express-validators

// body : Extracts and validates a specific field from the request body.
//  validationResult(req): Collects and returns any validation errors in the request.

router.post('/register',
    body('username').trim().isLength({min:3}),
    body('email').trim().isEmail().isLength({min:13}),
    body('password').trim().isLength({min:5}),
    async (req,res)=>{
    
    const errors = validationResult(req);
    

    if(!errors.isEmpty()){
        return res.status(400).json({
            errors:errors.array(),
            message:'Invalid data'
        })
    }

    

    const{ username,email,password} = req.body;
    const hashPassword = await bcrypt.hash(password,10);

    // Hashes the password securely using bcrypt with 10 salt rounds


    await userModel.create({
        username,
        email,
        password:hashPassword
    })

   res.send('SignUp Successfully');


    
})




router.get('/login',(req,res)=>{
    res.render('login')
})

router.get('/about',(req,res)=>{
    res.render('about')
})

router.post('/login',[
    body('username').trim().isLength({min:3}),
    body('password').trim().isLength({min:5})
],
    async(req,res)=>{

        const errors = validationResult(req);
        if(!errors.isEmpty()){
           return res.status(400).json({
                errors:errors.array(),
                message:"Invalid Username or Password"
            })
        }

        const{username,password} = req.body;

        const user = await userModel.findOne({username:username});

        if(!user){
            return res.status(400).json({
                errors:errors.array(),
                message:"Invalid Username or Password"
            })
        }


        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({
                errors:errors.array(),
                message:"Invalid Username or Password"
            })
        }


        const token = jwt.sign({
            userID:user._id,
            email:user.email,
            username:user.username
        },process.env.JWT_SECRET)

        res.cookie('token',token);
        res.send("Logged In ")

})

router.get('/logout',(req,res)=>{
    res.clearCookie('token');
    res.send({message:"logout successfully.."})
})

module.exports = router;