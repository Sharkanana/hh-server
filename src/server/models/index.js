import mongoose from 'mongoose';

import UserSchema from './schemas/user';
import PlanSchema from "./schemas/plan";

const connect = (uri) => {
  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('useCreateIndex', true);
  mongoose.Promise = global.Promise;

  mongoose.connection.on('error', (err) => {
    console.error(`Mongoose connection error: ${err}`);
    process.exit(1);
  });

  mongoose.model('User', UserSchema);
  mongoose.model('Plan', PlanSchema);
};

export default connect;
