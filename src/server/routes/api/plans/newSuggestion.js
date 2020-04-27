import PlanOverviewService from "../../../services/PlanOverviewService";

const { Router } = require('express');

/**
 * get a new suggestion for a particular date and meal in a plan
 */
module.exports = Router({mergeParams: true})
  .post('/newSuggestion', async (req, res, next) => {

    try {

      const results = await PlanOverviewService.newSuggestion(req.body.id, req.body.date, req.body.meal);

      return res.json(results);

    } catch(error) {
      console.log(error);
      next(error);
    }

  });
