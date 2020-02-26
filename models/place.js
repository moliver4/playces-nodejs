const mongoose = require('mongoose');

const Schema = mongoose.Schema;


//blueprint
const placeSchema=new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    address: { type: String, required: true },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' }
})
//ref established the relation from the User to the place
//files or images are never stored in a database

module.exports = mongoose.model('Place', placeSchema)