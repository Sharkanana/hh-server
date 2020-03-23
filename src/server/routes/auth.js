import { Router } from 'express';
import passport from 'passport';
import mongoose from 'mongoose';
import { isEmail } from 'validator';
import {sign} from "jsonwebtoken";
import {jwtSecret} from "../../config";

const router = new Router();

/**
 * Validate the sign up form
 *
 * @param {object} payload - the HTTP body message
 * @returns {object} The result of validation. Object contains a boolean validation result,
 *                   errors tips, and a global message for the whole form.
 */
function validateSignUpForm(payload) {
  const errors = validateBasicSignInSignUpForm(payload);

  if (!payload || typeof payload.password !== 'string' || payload.password.trim().length < 8) {
    errors.push("Password must be 8 characters long.");
  }

  return errors;
}

/**
 * Validate the login form
 *
 * @param {object} payload - the HTTP body message
 * @returns {object} The result of validation. Object contains a boolean validation result,
 *                   errors tips, and a global message for the whole form.
 */
function validateSignInForm(payload) {
  const errors = validateBasicSignInSignUpForm(payload);

  if (!payload || typeof payload.password !== 'string' || payload.password.trim().length === 0) {
    errors.push('Please enter a password.');
  }

  return errors;
}

function validateBasicSignInSignUpForm(payload) {
  const errors = [];

  if (!payload || typeof payload.email !== 'string' || !isEmail(payload.email.trim())) {
    errors.push("Email is invalid.");
  }

  return errors;
}

// Register api
router.post('/register', (req, res, next) => {

  const validationErrors = validateSignUpForm(req.body);

  if (Object.keys(validationErrors).length > 0) {
    return res.json({ errors: validationErrors });
  }

  return passport.authenticate('local-signup', (err) => {
    if (err) {
      let errMsg = err.name === 'MongoError' && err.code === 11000 ? 'Email already in use.' : 'Error registering.  Contact support.';

      return res.json({
        errors: [errMsg]
      });
    }

    return res.json({});
  })(req, res, next);
});

// Login api
router.post('/login', (req, res, next) => {
  const validationErrors = validateSignInForm(req.body);

  if (Object.keys(validationErrors).length > 0) {
    return res.json({ errors: validationErrors });
  }

  return passport.authenticate('local-login', (error, token, user) => {
    if (error !== null) {
      return res.json({
        errors: [error.code === 'INCORRECT_CREDENTIALS' ? 'Invalid credentials.' : error.code]
      });
    }

    return res.json({
      payload: {
        token,
        user,
      },
    });
  })(req, res, next);
});

// Refresh token api
router.post('/token', async (req, res, next) => {

  let userId = req.body.userId,
    refreshToken = req.body.refreshToken;

  //check if refresh token exists for user
  const refreshMatched = await mongoose.model('User').find({
    _id: userId,
    refreshToken: refreshToken
  });

  if(refreshMatched) {

    const token = sign({ sub: userId }, jwtSecret);

    return res.json({
      token
    });
  }
  else {
    res.send(401);
  }
});

module.exports = router;
