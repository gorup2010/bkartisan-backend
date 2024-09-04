import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/sqlconnect.js';

export type TransportType = 'free' | 'fix';

export interface ITransport {
  transportId: number;
  seller: string;
  type: TransportType;
  location: string;
  price: number;
  pricePerItem: number;
  deliveryTime: string;
}

export class TransportSchema {
    static async getTransports(seller: string) {
      const [transport] = await pool.query<RowDataPacket[]>(
        `
        select *
        from transport c
        where c.seller = ?;
      `,
        [seller]
      );
      return transport;
    }

    static async createTransport(transport: ITransport) {
      try {
  
        await pool.query<ResultSetHeader>(
          `
          INSERT INTO transport (seller, type, location, price, pricePerItem, deliveryTime)
          VALUES (?, ?, ?, ?, ?, ?);
        `,
          [
            transport.seller,
            transport.type,
            transport.location,
            transport.price,
            transport.pricePerItem,
            transport.deliveryTime
          ]
        );
      } catch (error) {
        console.error('Error add tranport:', error);
        throw error;
      }
    }

    

    static async updateTransports(transports : ITransport[]) {
        const connection = await pool.getConnection();
        try {
        await connection.beginTransaction();

        for (const transport of transports) {
            await connection.query<ResultSetHeader>(
            `
            UPDATE transport
            SET
                seller = ?,
                type = ?,
                location = ?,
                price = ?,
                pricePerItem = ?,
                deliveryTime = ?
            WHERE
                transportId = ?;
            `,
            [
                transport.seller,
                transport.type,
                transport.location,
                transport.price,
                transport.pricePerItem,
                transport.deliveryTime,
                transport.transportId
            ]
            );
        }

        await connection.commit();
        } catch (error) {
        await connection.rollback();
        throw error;
        } finally {
        connection.release();
        }
      }

    static async deleteTransport(transportId: number) {
         await pool.query<ResultSetHeader>(
            `
            DELETE FROM transport
            WHERE transportId = ?;
          `,
            [transportId]
          );
        
      }
  
  }