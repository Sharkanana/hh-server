
import PlanService from "../../../services/PlanService";
const { Router } = require('express');

/**
 * Create a plan from initial user settings
 */
module.exports = Router({mergeParams: true})
  .post('/createPlan', async (req, res, next) => {

    try {

      const results = await PlanService.createPlan(req.body.plan);

      return res.json(results);

    } catch(error) {

      console.log("Error with create plan:", error);

      return res.status(400).json({error: 'Server error.'});
    }

  });
