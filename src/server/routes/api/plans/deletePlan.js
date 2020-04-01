
const { Router } = require('express');
import PlanService from "../../../services/PlanService";

/**
 * load a user's plans
 */
module.exports = Router({mergeParams: true})
  .post('/deletePlan', async (req, res, next) => {

    try {

      const results = await PlanService.deletePlan(req.body.planId);

      return res.json(results);

    } catch(error) {
      next(error);
    }

  });
