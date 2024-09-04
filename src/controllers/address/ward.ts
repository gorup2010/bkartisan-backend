import { Response, Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import WardSchema from '../../models/address/ward.model.js';

const compareById = (a: any, b: any) => {
  const idA = a.wardId;
  const idB = b.wardId;
  if (idA < idB) {
    return -1;
  }
  if (idA > idB) {
    return 1;
  }
  return 0;
};

export const getWards = async (req: any, res: Response) => {
  const { districtId } = req.params;
  console.log(`districtId = ${districtId}`);

  try {
    const wards = await WardSchema.getWards(districtId);
    const derivedWards = wards.data
      .map((ward: any) => ({
        wardId: +ward.WardCode,
        wardName: ward.WardName,
      })).sort(compareById)
    return res.status(StatusCodes.OK).send(derivedWards);
  } catch (err) {
    console.log(err);
    throw err;
  }
};
