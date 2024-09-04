import { Response, Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import CitySchema from '../../models/address/city.model.js';

const compareById = (a: any, b: any) => {
  const idA = a.cityId;
  const idB = b.cityId;
  if (idA < idB) {
    return -1;
  }
  if (idA > idB) {
    return 1;
  }
  return 0;
};

export const getCities = async (req: any, res: Response) => {
  try {
    const cities = await CitySchema.getCities();
    const derivedCities = cities.data
      .map((city: any) => ({
        cityId: city.ProvinceID,
        cityName: city.ProvinceName,
      }))
      .sort(compareById);
    return res.status(StatusCodes.OK).send(derivedCities);
  } catch (err) {
    console.log(err);
    throw err;
  }
};
