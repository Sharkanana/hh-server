import { Router } from 'express';
import passport from 'passport';
import { isEmail } from 'validator';

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


  console.log(payload.password);

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

module.exports = router;
