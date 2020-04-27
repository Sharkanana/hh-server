import axios from 'axios';
import mongoose from 'mongoose';
import moment from "moment";

import config from '../../config';
import DateUtils from "../utils/DateUtils";
import YelpUtils from "../utils/YelpUtils";

const PlanModel = mongoose.model('Plan');

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
        startDate: DateUtils.formatForDisplay(plan.startDate),
        endDate: DateUtils.formatForDisplay(plan.endDate),
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
    await this._getBreakfastOptions();
    await this._getLunchOptions();
    await this._getDinnerOptions();

    //build new plan
    const planObj = {
      location: locationName,
      lat: this.locationCoords.lat,
      lng: this.locationCoords.lng,
      user: planConfig.user,
      startDate: planConfig.startDate,
      endDate: planConfig.endDate,
      name: planConfig.name,
      days:  this._buildDays()
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
  _buildDays() {

    let cfg = this.planConfig,
      days = [];

    for(const m = moment(cfg.startDate); m.isSameOrBefore(cfg.endDate); m.add(1, 'days')) {
      days.push(this._buildDay(DateUtils.formatForSave(m)));
    }

    return days;
  },

  /**
   * build a single day for a new plan
   * @param date
   */
  _buildDay(date) {

    return {
      date: date,
      b: this._selectBreakfast(),
      l: this._selectLunch(),
      d: this._selectDinner()
    };
  },

  _selectBreakfast() {
    return this.breakfastOptions.shift().id;
  },
  _selectLunch() {
    return this.lunchOptions.shift().id;
  },
  _selectDinner() {
    return this.dinnerOptions.shift().id;
  },

  /**
   * Fetch breakfast options for entire plan
   */
  async _getBreakfastOptions() {

    this.breakfastOptions = await YelpUtils.searchBusinesses({
      term: 'breakfast restaurants',
      longitude: this.locationCoords.lng,
      latitude: this.locationCoords.lat
    });
  },

  /**
   * Fetch lunch options for entire plan
   */
  async _getLunchOptions() {

    this.lunchOptions = await YelpUtils.searchBusinesses({
      term: 'lunch restaurants',
      longitude: this.locationCoords.lng,
      latitude: this.locationCoords.lat
    });
  },

  /**
   * Fetch dinner options for entire plan
   */
  async _getDinnerOptions() {

    this.dinnerOptions = await YelpUtils.searchBusinesses({
        term: 'dinner restaurants',
        longitude: this.locationCoords.lng,
        latitude: this.locationCoords.lat
    });
  }
};

export default PlanService;