import { Router } from "express";
import { getCities } from "../controllers/address/city.js";
import { getDistricts } from "../controllers/address/district.js";
import { getWards } from "../controllers/address/ward.js";
const addressRouter = Router();

addressRouter.get("/city", getCities);
addressRouter.get("/district/:cityId", getDistricts);
addressRouter.get("/ward/:districtId", getWards);

export default addressRouter;