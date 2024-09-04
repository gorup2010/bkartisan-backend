import mysql, { PoolOptions } from "mysql2/promise";

const access: PoolOptions = {
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  port: parseInt(process.env.SQL_PORT as string),
  ssl: {
    //rejectUnauthorized: true, PlanetScale
    rejectUnauthorized: false,
  },
  multipleStatements: true,
  timezone: "+07:00",
  dateStrings: true,
};

const pool = await mysql.createPool(access);

export default pool;
