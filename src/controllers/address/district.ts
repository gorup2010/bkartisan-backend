import { Response, Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import DistrictSchema from '../../models/address/district.model.js';

const compareById = (a: any, b: any) => {
  const idA = a.districtId;
  const idB = b.districtId;
  if (idA < idB) {
    return -1;
  }
  if (idA > idB) {
    return 1;
  }
  return 0;
};

export const getDistricts = async (req: any, res: Response) => {
  const { cityId } = req.params;
  console.log(`cityId = ${cityId}`);
  
  try {
    const districts = await DistrictSchema.getDistricts(cityId);
    const derivedDistricts = districts.data
      .map((district: any) => ({
        districtId: district.DistrictID,
        districtName: district.DistrictName,
      }))
      .sort(compareById);
    return res.status(StatusCodes.OK).send(derivedDistricts);
  } catch (err) {
    console.log(err);
    throw err;
  }
};
