const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')

const Schema = mongoose.Schema;

//blueprint
//unique only created an index in db to check make it faster to see uniquness
//validator actually validates
const userSchema=new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    image: { type: String, required: true },
    places: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Place' }]
})

userSchema.plugin(uniqueValidator)


module.exports = mongoose.model('User', userSchema)