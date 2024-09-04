import { Router } from 'express';
import { createReport, getReportDetails, getReports } from '../controllers/report.js';
import { authRole } from '../utils/permission.js';
import { authorize } from '../utils/authorize.js';
const reportRouter = Router();

reportRouter.get("/reports", authRole(['admin', 'collab']), getReports);

reportRouter.get("/reports/:id", authRole(['admin', 'collab']), getReportDetails);

reportRouter.post("/reports", authorize, createReport);

export default reportRouter;
