import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/sqlconnect.js';
import { addDays } from '../utils/helpers.js';

export interface User {
  username: string;
  password: string;
  name?: string;
  email?: string | undefined;
  address?: string;
  numPhone?: string;
  avatar?: string;
  gender?: 'M' | 'F' | 'U';
  loginType?: 'normal' | 'facebook' | 'google';
  createdAt?: Date;
  lockUntil?: Date;
  role: 'buyer' | 'seller' | 'collab' | 'admin';
}

type LockTimeOpts = 7 | 31 | 93;

class UserModel {
  static async getUsersList(
    byDate: string,
    byStatus: string,
    searchTerm: string,
    page: number,
    offset: number
  ) {
    let sql = `SELECT avatar, name, gender, numPhone, email, lockUntil, username FROM user WHERE (role = 'buyer' OR role = 'seller') `;
    let values = [];

    if (byStatus === 'normal') {
      sql += 'AND (lockUntil IS NULL OR lockUntil < CURRENT_TIMESTAMP()) ';
    } else if (byStatus === 'lock') {
      sql += 'AND lockUntil > CURRENT_TIMESTAMP ';
    }

    if (searchTerm != '') {
      sql += 'AND name LIKE ? ';
      values.push(`%${searchTerm}%`);
    }
    if (byDate === 'newToOld') {
      sql += 'ORDER BY createdAt desc ';
    } else {
      sql += 'ORDER BY createdAt asc ';
    }

    sql += 'LIMIT ? OFFSET ?;';
    values.push(Number(offset), Number(offset * (page - 1)));

    const [users] = await pool.query<RowDataPacket[]>({
      sql,
      values,
      rowsAsArray: true,
    });
    return users;
  }

  static async findOne(username: string) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `select * from user where username=?`,
        [username]
      );
      return rows[0];
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  static async findByEmail(email: string) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `select * from user where email = ?`,
        [email]
      );
      return rows[0];
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  static async create(newUser: User) {
    try {
      const createdAt = new Date();
      const [inserted] = await pool.query<ResultSetHeader>(
        `INSERT INTO user(username, password, name, email, address, numPhone, avatar, gender, loginType, role, createdAt) 
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
        [
          newUser.username,
          newUser.password,
          newUser.name,
          newUser.email,
          newUser.address,
          newUser.numPhone,
          newUser.avatar,
          newUser.gender,
          newUser.loginType,
          newUser.role,
          createdAt
        ]
      );
      return inserted;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async lockUser(
    username: string,
    lockTime: number,
    email: string,
    response: string
  ) {
    // update lock status
    const lockUntil = addDays(new Date(), lockTime);
    let sql = `update user set lockUntil = ? where username = ? and (role = 'buyer' OR role = 'seller'); `;

    // then insert new lock_response
    sql += `insert into lock_response(username, lockTime, email, response) values (?, ?, ?, ?);`;

    const res = await pool.query(sql, [
      lockUntil,
      username,
      username,
      lockUntil,
      email,
      response,
    ]);
    return res;
  }

  static async unlockUser(username: string) {
    // update lock status
    let sql = `update user set lockUntil = null where username = ?; `;

    // then delete lock_response
    sql += `DELETE FROM lock_response WHERE username = ?;`;

    const res = await pool.query(sql, [username, username]);
    return res;
  }

  static async getCollabsList(
    byDate: string,
    searchTerm: string,
    page: number,
    offset: number
  ) {
    let sql = `SELECT avatar, name, gender, numPhone, email, username FROM user WHERE (role = 'collab') `;
    let values = [];

    if (searchTerm != '') {
      sql += 'AND name LIKE ? ';
      values.push(`%${searchTerm}%`);
    }
    if (byDate === 'newToOld') {
      sql += 'ORDER BY createdAt desc ';
    } else {
      sql += 'ORDER BY createdAt asc ';
    }

    sql += 'LIMIT ? OFFSET ?;';
    values.push(Number(offset), Number(offset * (page - 1)));

    const [collabs] = await pool.query<RowDataPacket[]>({
      sql,
      values,
      rowsAsArray: true,
    });
    return collabs;
  }

  static async updateInfo(changedInfo: Partial<User>) {
    let sql = 'update user set ';
    let values = [];

    for (const key in changedInfo) {
      if (key !== 'username') {
        sql += `${key} = ? `;
        values.push(changedInfo[key]);
      }
    }

    if (sql === 'update user set ') {
      throw new Error("Infomation of collab doesn't change.");
    } else {
      sql += 'where username = ? ';
      values.push(changedInfo.username);
    }

    const res = await pool.query(sql, values);
    return res;
  }

  static async updatePassword(username: string, newPassword: string) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `update user set password = ? where username = ?`,
        [newPassword, username]
      );
      return rows[0];
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async getLockResponse(username: string) {
    const [response] = await pool.query<RowDataPacket[]>(
      `select lockTime, email, response from lock_response where username = ?;`,
      [username]
    );
    return response[0];
  }
}

export default UserModel;
