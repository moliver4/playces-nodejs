const express = require('express')
const router = express.Router();

router.get('/', (req, res, next) => {
    console.log('GET Request in Places');
    res.json({message: 'It works!'})
})


app.listen(5000)