
const { Router } = require('express');
import PlanService from "../../../services/PlanService";

/**
 * load a plan by id, for the plan overview
 */
module.exports = Router({mergeParams: true})
  .post('/loadPlan', async (req, res, next) => {

    try {

      const results = await PlanService.loadPlan(req.body.planId);

      return res.json(results);

    } catch(error) {
      console.log(error);
      next(error);
    }

  });
