import PlanOverviewService from "../../../services/PlanOverviewService";

const { Router } = require('express');

/**
 * load a plan by id, for the plan overview
 */
module.exports = Router({mergeParams: true})
  .post('/loadPlan', async (req, res, next) => {

    try {

      const results = await PlanOverviewService.loadPlan(req.body.planId);

      return res.json(results);

    } catch(error) {
      console.log(error);
      next(error);
    }

  });
