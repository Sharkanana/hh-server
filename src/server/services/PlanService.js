import axios from 'axios';
import config from '../../config';

const PlanService = {

  async createPlan(planConfig) {

    let locationCoords, locationName;

    // grab long/lat of selected location
    try {

      const results = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: planConfig.place_id,
          key: config.googleApiKey
        }
      });

      locationName = results.data.result.name;
      locationCoords = results.data.result.geometry.location;
    }
    catch(error) {
      console.log('Error looking up geo of selected location, PlanService: initPlan:');
      console.log(error);
    }

    // lookup 5 b/l/d spots within 5 miles (8k meters) of location

    let breakfastResults, lunchResults, dinnerResults;

    try {

      breakfastResults = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
        params: {
          key: config.googleApiKey,
          fields: 'name',
          input: 'breakfast',
          inputtype: 'textquery',
          locationbias: `circle:8000@${locationCoords.lat},${locationCoords.lng}`
        }
      });

      lunchResults = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
        params: {
          key: config.googleApiKey,
          fields: 'name',
          input: 'lunch',
          inputtype: 'textquery',
          locationbias: `circle:8000@${locationCoords.lat},${locationCoords.lng}`
        }
      });

      dinnerResults = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
        params: {
          key: config.googleApiKey,
          fields: 'name',
          input: 'dinner',
          inputtype: 'textquery',
          locationbias: `circle:8000@${locationCoords.lat},${locationCoords.lng}`
        }
      });

    }
    catch(error) {
      console.log('Error looking up b/l/d, PlanService: initPlan:');
      console.log(error);
    }

    const itemFn = function(item) {
      return {
        name: item.name
      };
    };

    // TODO: lets persist the plan next

    return {
      location: locationName,
      b: breakfastResults.data.candidates.map(itemFn),
      l: lunchResults.data.candidates.map(itemFn),
      d: dinnerResults.data.candidates.map(itemFn)
    };

  }

};

export default PlanService;