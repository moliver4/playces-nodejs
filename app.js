const fs = require('fs') 
const path = require('path')

const express = require("express");
const bodyParser = require("body-parser");
const HttpError = require("./models/http-error");
const mongoose = require("mongoose");

require("dotenv").config();

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");

const app = express();


app.use(bodyParser.json()); //parses for any json data and automatically calls next

//static serving returns a file, does not execute it
//control which files in what folder we want to return
//it wants a path to the folder (absolute) 
app.use('/uploads/images', express.static(path.join('uploads', 'images')))

//adding headers to response for CORS 
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
    res.setHeader('Access-Control-ALlow-Methods', 'GET, POST, PATCH, DELETE')
    next()
})


app.use("/api/places", placesRoutes); // => /api/places...
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("could not find this route", 404);
  throw error;
});

//4 parameters, express knows it is an error handling middleware
app.use((error, req, res, next) => {
  //multer has the file property if we have file
  //so we know if file exists, the request that failed was stored.
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log('error, rolling back image', err)
    })
  }
  //if a response has already been sent, we just call next and forward it
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});


//first establish connect to database, if successful then we start backend server. otherwise, throw error.
const connectUrl= `mongodb+srv://tiffany:${encodeURIComponent(
    process.env.PASSWORD
  )}@cluster0-ar6sc.mongodb.net/playcesmern?retryWrites=true&w=majority`
const connectConfig = {
 useNewUrlParser: true,
 useUnifiedTopology: true,
 useCreateIndex: true
}
mongoose.connect(connectUrl, connectConfig)
.then(() => {
 console.log('+++ Database connected! +++');
 app.listen(5000);
})
.catch(err => {
 console.log(err);
});
//connect returns promise
