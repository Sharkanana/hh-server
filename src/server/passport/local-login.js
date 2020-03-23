import { sign } from 'jsonwebtoken';
import { Strategy as PassportLocalStrategy } from 'passport-local';
import { jwtSecret } from '../../config';

const randtoken = require('rand-token');

const getStrategy = (User) => new PassportLocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  session: false,
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    const user = await User.findOne({ email: email.trim() });

    if (!user) {
      return done({code: 'INCORRECT_CREDENTIALS'});
    }

    const matched = await user.comparePassword(password.trim());

    if (!matched) {
      return done({code: 'INCORRECT_CREDENTIALS'});
    }

    const refreshToken = randtoken.uid(256);

    await user.updateOne({refreshToken});

    done(null, sign({ sub: user._id }, jwtSecret), {
      id: user._id,
      email: user.email,
      refreshToken: refreshToken
    });
  } catch (e) {
    console.error(e);
    done({code: 'FORM_SUBMISSION_FAILED', info: e});
  }
});

export default getStrategy;
