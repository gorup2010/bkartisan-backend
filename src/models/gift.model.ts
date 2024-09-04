import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/sqlconnect.js';

export type GiftType = 'box' | 'card';

export interface IGift {
    giftId?: number;
    seller: string;
    name: string;
    coverImage: string;
    type: GiftType;
    price: number;
  }

class GiftSchema {
    static async getGifts(
        seller: string,
        type: string,
        searchTerm: string,
        page: number,
        offset: number
    ) {
        try {
            const limit = parseInt(offset.toString(), 10);
            const offsetValue = (page - 1) * offset;
            let query = `
                SELECT * FROM gift
                WHERE seller = ? AND name LIKE ?`;
            const queryParams: (string | number)[] = [seller, `%${searchTerm}%`];
    
            if (type !== 'all') {
                query += ' AND type = ?';
                queryParams.push(type);
            }
    
            query += ' LIMIT ? OFFSET ?';
            queryParams.push(limit, offsetValue);
    
            const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);
            return rows;
        } catch (err) {
            throw err;
        }
    }
    static async createGift(gift: IGift) {
        try {
            const query = `
                INSERT INTO gift (seller, name, coverImage, type, price)
                VALUES (?, ?, ?, ?, ?);
            `;
            await pool.query<ResultSetHeader>(query, [
                gift.seller,
                gift.name,
                gift.coverImage,
                gift.type,
                gift.price,
            ]);
        }
        catch(err) {
            throw err;
        }
      }
      static async deleteGift(giftIds: number[]) {
        try {
            const batchSize = 1000;
            const promises = [];
    
            for (let i = 0; i < giftIds.length; i += batchSize) {
                const batch = giftIds.slice(i, i + batchSize);
                const query = `
                    DELETE FROM gift
                    WHERE giftId IN (?);
                `;
                promises.push(pool.query<ResultSetHeader>(query, [batch]));
            }
    
            await Promise.all(promises);
        } catch (err) {
            throw err;
        }
    }

    static async getiftDetail(giftId: number) {
        try {
            const [rows] = await pool.query<RowDataPacket[]>(
                `
              select * 
              from gift 
              where giftId = ?
              `,
                [giftId]
              );
              return rows;
        }
        catch(err) {
            throw err;
        }
        
      }
    static async updateGift(gift: IGift) {
        try {
            const query = `
                UPDATE gift
                SET seller = ?, name = ?, coverImage = ?, type = ?, price = ?
                WHERE giftId = ?;
            `;
            await pool.query<ResultSetHeader>(query, [
                gift.seller,
                gift.name,
                gift.coverImage,
                gift.type,
                gift.price,
                gift.giftId,
            ]);
        }
        catch(err) {
            throw err;
        }
        
      }
    
}

export default GiftSchema;