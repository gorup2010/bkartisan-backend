import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/sqlconnect.js';

export interface IOption {
  optionId: number;
  optionName: string;
  parentOptionId: number;
}

export class OptionSchema {
  static async getOptionParents() {
    const [options] = await pool.query<RowDataPacket[]>(
      `
      select optionId, optionName
      from options
      where parentOptionId = 0;
    `,
    );
    return options;
  }

  static async getChildOptionParents(optionName: string) {
    const [childOptions] = await pool.query<RowDataPacket[]>(
      `
      SELECT optionName
      FROM options
      WHERE parentOptionId = (
        SELECT optionId
        FROM options
        WHERE optionName = ?
      );
    `,
      [optionName]
    );
    return childOptions;
  }
}
