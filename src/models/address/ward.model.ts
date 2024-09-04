import pool from '../../config/sqlconnect.js';
import axios from 'axios';



class WardSchema {
  static getWards = async (districtId: number) => {
    try {
      const { data } = await axios.get(`${process.env.GHN_API_URL}/ward`, {
        headers: {
          token: process.env.GHN_API_KEY,
        },
        params: {
          district_id: districtId,
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

export default WardSchema;
