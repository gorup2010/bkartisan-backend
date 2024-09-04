import pool from '../../config/sqlconnect.js';
import axios from 'axios';
// export interface ICity {

// }

class DistrictSchema {
  static getDistricts = async (cityId: number) => {
    try {
      const { data } = await axios.get(`${process.env.GHN_API_URL}/district`, {
        headers: {
          token: process.env.GHN_API_KEY,
          province_id: cityId,
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

export default DistrictSchema;
