const express = require('express');
const { check } = require('express-validator');

const usersController = require('../controllers/users-controllers');
const fileUpload = require('../middleware/file-upload')
const router = express.Router();

router.get('/', usersController.getUsers);

router.post(
    '/signup',
    //middleware to reteive a single file, parameter is key or name of incoming file. we expect an image key
    fileUpload.single('image'),
    [
      check('name')
        .not()
        .isEmpty(),
      check('email')
        .normalizeEmail()
        .isEmail(),
      check('password').isLength({ min: 6 })
    ],
    usersController.signup
  );

router.post('/login', usersController.login);

module.exports = router;
