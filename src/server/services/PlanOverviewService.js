
import mongoose from 'mongoose';
import { uniq } from 'lodash';

import DateUtils from "../utils/DateUtils";
import YelpUtils from "../utils/YelpUtils";

const PlanModel = mongoose.model('Plan');

const PlanOverviewService = {

  /**
   * load new suggestion for a specific date/meal for a plan
   */
  async newSuggestion(planId, date, meal) {

    const mealCode = meal.charAt(0).toLowerCase();

    // load plan first
    let plan = await PlanModel.findOne({
      _id: planId
    });

    // lookup potential new suggestions
    const suggestions = await YelpUtils.searchBusinesses({
      term: `${meal} restaurants`,
      longitude: plan.lng,
      latitude: plan.lat
    });

    let dayIdx = 0,
        excludedIds = [];

    // gather list of all current selection ids, and find index for where new selection goes
    plan.days.forEach(function(day, idx) {

      if(DateUtils.areSameDate(day.date, DateUtils.parseDisplayDate(date))) {
        dayIdx = idx;
        excludedIds.push(day[mealCode]);
        plan.rejectedIds.push(day[mealCode]);
      }

      excludedIds = [...excludedIds, day.b, day.l, day.d];
    });

    // also add previously rejectedIds to exclusion list
    excludedIds = [...excludedIds, ...plan.rejectedIds];

    // find new suggestion
    let newSuggestion = '';

    suggestions.forEach(function(sugg) {

      // if suggestion not excluded, lets try it
      if(excludedIds.indexOf(sugg.id) === -1) {
        newSuggestion = sugg.id;
        return false;
      }
    });

    plan.days[dayIdx][mealCode] = newSuggestion;
    plan.markModified('days');

    // ensure rejected ids has no dupes
    plan.rejectedIds = uniq(plan.rejectedIds);

    // persist new selection
    try {
      await plan.save();
    } catch (err) {
      console.error('Error updating plan for new selection:');
      console.error(err);

      throw err;
    }

    // load full data for suggestion and return
    return this._buildDayResult(await YelpUtils.businessDetails(newSuggestion, 'name', 'rating', 'categories', 'url', 'review_count'));
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
    const results = await YelpUtils.gqlSearch(gql);

    //loop to set results
    plan.days = plan.days.map(function(day) {

      return {
        date: DateUtils.formatForDisplay(day.date),
        b: service._buildDayResult(results[resultMap[day.b]]),
        l: service._buildDayResult(results[resultMap[day.l]]),
        d: service._buildDayResult(results[resultMap[day.d]])
      };

    });

    return plan;
  },

  /**
   * processing/formatting of day data
   * @param day
   */
  _buildDayResult(day) {

    return {
      ...day,
      categories: day.categories.reduce((result, cat)=>{
        return `${result}${cat.title}, `;
      }, '').slice(0,-2)
    };

  }
};

export default PlanOverviewService;