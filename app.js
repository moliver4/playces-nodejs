const express = require('express');
const bodyParser = require('body-parser');
const HttpError = require('./models/http-error');
require('dotenv').config()

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');

const app = express();


//registered as middleware with appjs
app.use(bodyParser.json()); //parses for any json data and automatically calls next

app.use('/api/places', placesRoutes); // => /api/places...
app.use('/api/users', usersRoutes);

app.use((req,res,next)=>{
    const error = new HttpError('could not find this route', 404)
    throw error
})

//4 parameters, express knows it is an error handling middleware
app.use((error, req, res, next) => {
  //if a response has already been sent, we just call next and forward it
    if (res.headerSent) {
      return next(error);
    }
    res.status(error.code || 500)
    res.json({message: error.message || 'An unknown error occurred!'});
  });

app.listen(5000);