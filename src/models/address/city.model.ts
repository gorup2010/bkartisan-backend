import pool from '../../config/sqlconnect.js';
import axios from 'axios';
// export interface ICity {

// }

class CitySchema {
  static getCities = async () => {
    try {
      const { data } = await axios.get(`${process.env.GHN_API_URL}/province`, {
        headers: {
          token: process.env.GHN_API_KEY,
        },
      });
      // console.log(data);
      return data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  };
}

export default CitySchema;
