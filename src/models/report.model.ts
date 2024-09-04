import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/sqlconnect.js";
import { response } from "express";

export interface Report {
  reportId: string;
  reporter: string;
  reportedUser: string;
  createdAt: Date;
  reason: string;
  additionalInfo?: string;
  type: "Bình luận" | "Sản phẩm" | "Mua bán";
  handler?: string;
  status: "Chưa xem" | "Chưa xử lý" | "Đã xử lý";
  refId: number;
  handledAt: Date;
  violation: string;
  response: string;
}

export default class ReportModel {
  static async getReportsList(
    username: string,
    role: string,
    byDate: string,
    byStatus: string,
    byType: string,
    searchTerm: string,
    mode: string,
    page: number,
    offset: number
  ) {
    let sql = `SELECT type, reporter, reportedUser, status, createdAt, reportId FROM report `;
    let values = [];

    const whereClause = [];
    if (byStatus !== "Toàn bộ") {
      whereClause.push("status = ? ");
      values.push(byStatus);
    }
    if (byType !== "Toàn bộ") {
      whereClause.push("type = ? ");
      values.push(byType);
    }
    if (searchTerm != "") {
      whereClause.push("(reporter LIKE ? OR reportedUser LIKE ? ) ");
      values.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }
    if (role !== "admin") {
      whereClause.push("handler = ? ");
      values.push(username);
    } else {
      if (mode === "Của bản thân") {
        whereClause.push("handler = ? ");
        values.push(username);
      } else {
        whereClause.push("handler != ? ");
        values.push(username);
      }
    }
    if (whereClause.length != 0) {
      sql += "WHERE " + whereClause.join("AND ");
    }

    if (byDate === "newToOld") {
      sql += "ORDER BY createdAt desc ";
    } else {
      sql += "ORDER BY createdAt asc ";
    }

    sql += "LIMIT ? OFFSET ?;";
    values.push(Number(offset), Number(offset * (page - 1)));

    const [reports] = await pool.query<RowDataPacket[]>({
      sql,
      values,
      rowsAsArray: true,
    });

    return reports;
  }

  static async getReportDetails(id: string) {
    let sql = "select type, status from report where reportId = ? ";
    let values = [id];

    const [res] = await pool.query<RowDataPacket[]>({
      sql,
      values,
    });

    if (res[0].type == "Bình luận") {
      sql = `select r.*, c.numberOfStars, c.content, c.createdAt as commentCreatedAt, u.avatar as writerAvatar 
        from report r left join comment c on c.commentId = r.refId left join user u on u.username = c.writer `;
    } else if (res[0].type == "Sản phẩm") {
      sql = `select p.name, p.price as originalCost, p.isOnSale, p.discount, 
        p.introduction, p.seller, p.description, u.avatar as sellerImage, u.name as sellerName, r.* 
        from report r 
        left join product p on p.productId = r.refId 
        left join user u on u.username = p.seller `;
    } else {
      sql = "select * from report ";
    }

    sql += "where reportId = ? ";

    console.log(sql);

    const [report] = await pool.query<RowDataPacket[]>({
      sql,
      values,
    });

    return report[0];
  }

  static async changeToRead(reportId) {
    const [res] = await pool.query(
      `update report set status = 'Chưa xử lý' where reportId = ?`,
      [reportId]
    );
    return res;
  }

  static async createReport({ reporter, reporterName, reportedUser, reportedUserName, reason, additionalInfo, type, refId }) {
    let sql = `
      INSERT INTO report(reporter, reporterName, reportedUser, reportedUserName, reason, additionalInfo, type, refId, createdAt, handler, handlerName)
      SELECT ?,?,?,?,?,?,?,?,?,
          res.username AS handler,
          res.avatar as handlerName
      FROM
          (SELECT 
              u.username, u.name, COUNT(r.reportId) AS sumReport
          FROM
              user u
          LEFT JOIN report r ON r.handler = u.username
          WHERE
              u.role = 'collab' OR u.role = 'admin'
          GROUP BY u.username
          ORDER BY sumReport ASC
          LIMIT 1) res;
          `;
    const createdAt = new Date();
    const values = [reporter, reporterName, reportedUser, reportedUserName, reason, additionalInfo, type, refId, createdAt]

    const [res] = await pool.query<RowDataPacket[]>({
      sql,
      values,
    });

    return res;
  }
}
