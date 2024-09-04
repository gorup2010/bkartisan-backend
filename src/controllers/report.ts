import { StatusCodes } from "http-status-codes";
import ReportModel, { Report } from "../models/report.model.js";
import { Response } from "express";
import ProductLinkSchema from "../models/productLink.model.js";

export const getReports = async (req: any, res: Response) => {
  try {
    let { byDate, byStatus, byType, searchTerm, mode, page, offset } = req.query;
    if (!page) {
      page = 1;
    }
    if (!offset) {
      offset = 10;
    }

    const { username, role } = req.user;
    const reports = await ReportModel.getReportsList(username, role, byDate, byStatus, byType, searchTerm, mode, page, offset);
    res.status(StatusCodes.OK).send(reports);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: "Internal Server Error" });
  }
};

export const getReportDetails = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const report = await ReportModel.getReportDetails(id);
    console.log(report);
    if (report.type === "Sản phẩm") {
      const assets = await ProductLinkSchema.getProductLinks(report.refId);
      report.currentCost = report.originalCost * (1 - report.discount / 100), 
      report.assets = assets;
    }
    if (report.status === "Chưa xem" && report.handler === req.user.username) {
      await ReportModel.changeToRead(report.reportId);
    }
    res.status(StatusCodes.OK).send(report);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: "Internal Server Error" });
  }
};

export const createReport = async (req: any, res: Response) => {
  try {
    const report = req.body;
    const result = await ReportModel.createReport(report);
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: "Internal Server Error" });
  }
};