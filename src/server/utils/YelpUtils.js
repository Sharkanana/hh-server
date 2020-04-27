import axios from "axios";
import { pick } from 'lodash';

import config from "../../config";

const YelpUtils = {

  async searchBusinesses(params) {

    const results = await axios.get('https://api.yelp.com/v3/businesses/search', {
      params: {
        term: 'restaurants',
        radius: 5000,
        sort_by: 'rating',
        ...params
      },
      headers: {
        Authorization: `Bearer ${config.yelpApiKey}`
      }
    });

    return results.data.businesses;
  },

  async gqlSearch(gql) {

    const response = await axios.post(`https://api.yelp.com/v3/graphql`, gql,
      {
        headers: {
          Authorization: `Bearer ${config.yelpApiKey}`,
          'Content-Type': 'application/graphql'
        }
      });

    return response.data.data;
  },

  async businessDetails(bizId, ...props) {

    const results = await axios.get(`https://api.yelp.com/v3/businesses/${bizId}`, {
      headers: {
        Authorization: `Bearer ${config.yelpApiKey}`
      }
    });

    return props ? pick(results.data, props) : results.data;
  }

};

export default YelpUtils;