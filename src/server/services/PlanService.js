import axios from 'axios';
import config from '../../config';
import mongoose from 'mongoose';
import moment from "moment";

const PlanModel = mongoose.model('Plan');
const displayDateFormat = 'MMM Do, YYYY(ddd)';
const saveDateFormat = 'YYYY-MM-DD';

const PlanService = {

  /**
   * Load a user's plans for display on the 'my plans' screen
   */
  async loadPlans(user) {

    const plans = await PlanModel.find({
      user: user
    });

    return plans.map(function(plan) {

      return {
        id: plan._id,
        location: plan.location,
        startDate: moment(plan.startDate).utc().format(displayDateFormat),
        endDate: moment(plan.endDate).utc().format(displayDateFormat),
        name: plan.name
      }
    });
  },

  /**
   * Load restaurant details for a plan
   */
  async loadPlan(planId) {

    let service = this,
      gql = '{',
      resultMap = {},
      count = 0;

    // load plan first
    let plan = await PlanModel.findOne({
      _id: planId
    });

    //loop to build gql
    plan.days.forEach(function (day) {

      resultMap[day.b] = `a${count++}`;
      resultMap[day.l] = `a${count++}`;
      resultMap[day.d] = `a${count++}`;

      gql += `${resultMap[day.b]}: business(id:"${day.b}"){...bizInfo}\n${resultMap[day.l]}:business(id:"${day.l}"){...bizInfo}\n${resultMap[day.d]}:business(id:"${day.d}"){...bizInfo}\n`;
    });

    gql += '} fragment bizInfo on Business { name\nrating\ncategories { title }\nurl\nreview_count}';

    //fetch results

    const response = await axios.post(`https://api.yelp.com/v3/graphql`, gql,
      {
        headers: {
          Authorization: `Bearer ${config.yelpApiKey}`,
          'Content-Type': 'application/graphql'
        }
      });
    const results = response.data.data;

    //loop to set results
    plan.days = plan.days.map(function(day) {

      return {
        date: moment(day.date).utc().format(displayDateFormat),
        b: service.buildDayResult(results[resultMap[day.b]]),
        l: service.buildDayResult(results[resultMap[day.l]]),
        d: service.buildDayResult(results[resultMap[day.d]])
      };

    });

    return plan;
  },

  /**
   * processing/formatting of day data
   * @param day
   */
  buildDayResult(day) {

    return {
      ...day,
      categories: day.categories.reduce((result, cat)=>{
        return `${result}${cat.title}, `;
      }, '').slice(0,-2)
    };

  },

  /**
   * Delete a plan
   */
  async deletePlan(planId) {
    await PlanModel.deleteOne({ _id: planId });
    return true;
  },

  /**
   * Create a plan from the data gathered from plan form, and the user's profile
   */
  async createPlan(planConfig) {

    this.planConfig = planConfig;

    let locationCoords, locationName;

    // grab long/lat of selected location
    try {

      const results = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: planConfig.place_id,
          key: config.googleApiKey
        }
      });

      locationName = results.data.result.formatted_address;
      this.locationCoords = results.data.result.geometry.location;
    } catch (err) {
      console.log('Error looking up geo of selected location, PlanService: initPlan:');
      console.log(err);

      throw err;
    }

    //fetch possible restaurants
    await this.getBreakfastOptions();
    await this.getLunchOptions();
    await this.getDinnerOptions();

    //build new plan
    const planObj = {
      location: locationName,
      lat: this.locationCoords.lat,
      lng: this.locationCoords.lng,
      user: planConfig.user,
      startDate: planConfig.startDate,
      endDate: planConfig.endDate,
      name: planConfig.name,
      days:  this.buildDays()
    };

    //persist new plan
    try {
      const newPlan = new PlanModel(planObj);

      await newPlan.save();

      return newPlan;

    } catch (err) {
      console.error('Error creating new plan:');
      console.error(err);

      throw err;
    }
  },

  /**
   * build up entire days structure for a new plan
   */
  buildDays() {

    let cfg = this.planConfig,
      days = [];

    for(const m = moment(cfg.startDate); m.isSameOrBefore(cfg.endDate); m.add(1, 'days')) {
      days.push(this.buildDay(m.format(saveDateFormat)));
    }

    return days;
  },

  /**
   * build a single day for a new plan
   * @param date
   */
  buildDay(date) {

    return {
      date: date,
      b: this.selectBreakfast(),
      l: this.selectLunch(),
      d: this.selectDinner()
    };
  },

  selectBreakfast() {
    return this.breakfastOptions.shift().id;
  },
  selectLunch() {
    return this.lunchOptions.shift().id;
  },
  selectDinner() {
    return this.dinnerOptions.shift().id;
  },

  /**
   * Fetch breakfast options for entire plan
   */
  async getBreakfastOptions() {

    const results = await axios.get('https://api.yelp.com/v3/businesses/search', {
      params: {
        term: 'breakfast restaurants',
        longitude: this.locationCoords.lng,
        latitude: this.locationCoords.lat,
        radius: 5000, // about 3 mile radius
        sort_by: 'rating'
      },
      headers: {
        Authorization: `Bearer ${config.yelpApiKey}`
      }
    });

    this.breakfastOptions = results.data.businesses;
  },

  /**
   * Fetch lunch options for entire plan
   */
  async getLunchOptions() {const results = await axios.get('https://api.yelp.com/v3/businesses/search', {
    params: {
      term: 'lunch restaurants',
      longitude: this.locationCoords.lng,
      latitude: this.locationCoords.lat,
      radius: 5000, // about 3 mile radius
      sort_by: 'rating'
    },
    headers: {
      Authorization: `Bearer ${config.yelpApiKey}`
    }
  });

    this.lunchOptions = results.data.businesses;
  },

  /**
   * Fetch dinner options for entire plan
   */
  async getDinnerOptions() {
    const results = await axios.get('https://api.yelp.com/v3/businesses/search', {
      params: {
        term: 'dinner restaurants',
        longitude: this.locationCoords.lng,
        latitude: this.locationCoords.lat,
        radius: 5000, // about 3 mile radius
        sort_by: 'rating'
      },
      headers: {
        Authorization: `Bearer ${config.yelpApiKey}`
      }
    });

    this.dinnerOptions = results.data.businesses;
  }
};

export default PlanService;