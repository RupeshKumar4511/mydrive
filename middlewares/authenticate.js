const jwt = require('jsonwebtoken');

function authemiddleware(req,res,next){
    const token = req.cookies.token;
    

    if(!token){
        return res.status(401).json({
            message:"Unauthorized user ! Please login first",
            success:false,
        })
    }

    try{

        // here decoded contains the user detail which is used to create tokens. 
        const decoded = jwt.verify(token,process.env.JWT_SECRET);

        // It verifies and decodes a JWT (JSON Web Token) using a secret key or a public key.
        //  If the token is valid, it returns the decoded payload (user data).
        //  If the token is invalid or expired, it throws an error.

        req.user = decoded 
        // here "user" is the custom property which is added to req object and it stores user data. 

        next();

    }catch(error){
        console.log(error);
        return res.status(401).send({message:"Unauthorized ! Please login first."})
    }
}


module.exports = authemiddleware;
