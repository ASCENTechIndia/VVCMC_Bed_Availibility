const express = require('express');
const { login } = require('./auth.controller');
const validate = require('../../middleware/validate.middleware');
const { loginSchema } = require('./auth.validation');

const router = express.Router();

const  isValidToken  = require('./isValidToken');

router.post('/validate-token', isValidToken);

router.post('/login', validate(loginSchema), login);


module.exports = router;
