const { validationResult } = require('express-validator');
const mongoose = require("mongoose");

const User = require('../models/user')
const Place = require("../models/place");
const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');

let DUMMY_PLACES = [
    {
      id: 'p1',
      title: 'Empire State Building',
      description: 'One of the most famous sky scrapers in the world!',
      location: {
        lat: 40.7484474,
        lng: -73.9871516
      },
      address: '20 W 34th St, New York, NY 10001',
      creator: 'u1'
    }
  ];

const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid; // { pid: 'p1' }
  
    //static method, not used on the instance, on the whole collection
    //not a real promise async but can still use async await (mongoose specific)
    //use exec if you need a real promise
    let place;
    try { 
      place = await Place.findById(placeId)
    } catch (err) {
      const error = new HttpError (
        'Something went wrong, could not find the place', 500
      )
      return next(error)
    }
    //these are two different error requests. one is a network error and one is a db error
    if (!place) {
      const error = new HttpError('Could not find a place for the provided id.', 404);
      return next(error)
    }
    
    //want to get rid of the _id property from db
    //mongoose adds an id getter to every document that returns id as a string
    //sometimes its lost when we do toObject, but now its true with getters true
    //mongoose knows to add id property to obejct
    res.json({ place: place.toObject({ getters:true }) }); 
};

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;
  
    //mongodb usually returns a cursor so you dont bloat your data
    //mongoose just plain array

    //original code commented out. refactored with populate method. 
    //instead of sifting through all places, now we are using populate on the exact user.
    // let places ;
    let userWithPlaces;
    try {
      // places = await Place.find({ creator: userId })
      userWithPlaces = await User.findById(userId).populate('places')
    } catch (err) {
      const error = new HttpError (
        'Fetching places failed, please try again later', 500
      )
      return next(error)
    }

    if (!userWithPlaces || userWithPlaces.places.length === 0) {
      return next(
        new HttpError('Could not find a place for the provided user id.', 404)
      );
    }
  
    res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) });
  }

  const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    //using next because throw does not work in async
    if (!errors.isEmpty()) {
      return next(
        new HttpError('Invalid inputs passed, please check your data.', 422)
      );
    }
  
    const { title, description, address, creator } = req.body;
  
    let coordinates;
    try {
      coordinates = await getCoordsForAddress(address);
    } catch (error) {
      return next(error);
    }
  
  // const title = req.body.title;
    const createdPlace = new Place({
      title,
      description,
      address,
      location: coordinates,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/400px-Empire_State_Building_%28aerial_view%29.jpg',
      creator
    });

    //need to check if user is in DB before can create place
    let user;
    try {
      user = await User.findById(creator);
    } catch (err) {
      const error = new HttpError(
        'Creating place failed, please try again.',
        500
      );
      return next(error);
    }
  
    if (!user) {
      const error = new HttpError(
        'Could not find user for provided id', 404
      );
      return next(error)
    }

    console.log(user);

    //need to save the place anddddddd add it to the user's info
    //only if both succeed then we want to change documents
    //use transactions and sessions
    //transactions allow to perform multiple operations in isolation and undo them in isolation
    //built on sessions. need to start session for transaction
    //only if all things are successful, will the session commit transaction.
    //otherwise all things will be rolled back by mongodb

    //mongoose 'push' method allows mongoose to establish connection between two models
    //ONLY actually adds the place's id
    try {
     const sess = await mongoose.startSession();
      sess.startTransaction();
      await createdPlace.save({ session: sess })
      user.places.push(createdPlace);
      await user.save({ session: sess })
      await sess.commitTransaction();

    } catch (err) {
      const error = new HttpError(
        'Creating place failed, please try again.',
        500
      );
      return next(error);
    }
    
    res.status(201).json({ place: createdPlace.toObject({ getters: true }) });
  };


  const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;
  
    let place;
    try { 
      place = await Place.findById(placeId)
    } catch (err) {
      const error = new HttpError (
        'Something went wrong, could not find the place', 500
      )
      return next(error)
    }
    
        place.title = title;
        place.description = description;

    try {
      await place.save();
    } catch (err) {
      const error = new HttpError(
        'Something went wrong, could not update the place',
        500
      );
      return next(error);
    }
  
  
    res.status(200).json({place: place.toObject( { getters: true })});
  };

  //populate method allows us to work with document related to this document and change it
  
  const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try { 
      place = await Place.findById(placeId).populate('creator')

    } catch (err) {
      const error = new HttpError (
        'Something went wrong, could not find the place', 500
      )
      return next(error)
    }

    if (!place) {
      const error = new HttpError (
        'Something went wrong, could not find the place', 404
      )
      return next(error)
    }
    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await place.remove({ session: sess });
      place.creator.places.pull(place);
      await place.creator.save({ session: sess })
      await sess.commitTransaction();
    } catch (err) {
      const error = new HttpError (
        'Something went wrong, could not delete the place', 500
      )
      return next(error)
    }

    res.status(200).json({message: 'Deleted place successfully'})
  };
  
  exports.getPlaceById = getPlaceById;
  exports.getPlacesByUserId = getPlacesByUserId;
  exports.createPlace = createPlace;
  exports.updatePlace = updatePlace;
  exports.deletePlace = deletePlace;
