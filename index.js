const express = require('express');
const path = require('path');
const app = express();
const userRouters = require('./routes/userRouters')
const indexRoutes = require('./routes/indexRoutes')
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
dotenv.config();

const PORT = process.env.PORT;

// Loads .env file contents into process.env by default. If DOTENV_KEY is present, it smartly attempts to load encrypted .env.vault file contents into process.env.
// process.env is a global object in Node.js that stores environment variables.


app.set('view engine','ejs');
app.set('views',path.resolve('./views/pages'))

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}))


// this is the last hope to caught the error
process.on('uncaughtException',(error)=>{
    console.log(error);

})

app.use('/',userRouters );
app.use('/services',indexRoutes );


app.listen(PORT,()=>{
    console.log("Server is running on port",PORT);
})