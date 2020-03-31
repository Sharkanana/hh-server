
import PlanService from "../../../services/PlanService";
const { Router } = require('express');

/**
 * Create a plan from initial user settings
 */
module.exports = Router({mergeParams: true})
  .post('/createPlan', async (req, res, next) => {

    try {

      let placeId = req.body.place_id;

      const results = await PlanService.createPlan({ place_id: placeId });

      return res.json(results);

    } catch(error) {
      next(error);
    }

  });
