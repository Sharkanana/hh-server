import mongoose from 'mongoose';
import { isArray } from 'lodash';

// define the Plan model schema
const PlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectID,
    ref: 'User'
  },
  location: String,
  lat: String,
  lng: String,
  startDate: Date,
  endDate: Date,
  name: String,
  rejectedIds: [],
  days: {
    type: [{}],
    validate: {
      validator: function(v) {

        if(isArray(v)) {

          for(let day of v) {

            if(!day.date || !day.b || !day.l || !day.d) {
              return false;
            }
          }

          return true;

        }

        return false;

      },
      message: 'Days are not valid.'
    }
  }
});

export default PlanSchema;
