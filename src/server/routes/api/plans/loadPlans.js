
const { Router } = require('express');
import PlanService from "../../../services/PlanService";

/**
 * load a user's plans
 */
module.exports = Router({mergeParams: true})
  .post('/loadPlans', async (req, res, next) => {

    try {

      const results = await PlanService.loadPlans(req.body.user);

      return res.json(results);

    } catch(error) {
      next(error);
    }

  });
