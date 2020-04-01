import axios from 'axios';
import config from '../../config';
import { format } from 'date-fns';
import { eachDayOfInterval } from 'date-fns';
import mongoose from 'mongoose';

const PlanModel = mongoose.model('Plan');
const dateFormat = 'yyyy-MM-dd';

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
        startDate: format(plan.startDate, dateFormat),
        endDate: format(plan.startDate, dateFormat),
        name: plan.name
      }
    });
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

    for(const date of eachDayOfInterval({ start: new Date(cfg.startDate), end: new Date(cfg.endDate)})) {
      days.push(this.buildDay(date));
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