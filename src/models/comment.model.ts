import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/sqlconnect.js';

export interface IComment {
  id?: number;
  productId: number;
  content: string;
  createdAt?: Date;
  writer: string;
  writerAvatar?: string;
  numberOfUpvotes?: number;
  numberOfDownVotes?: number;
}

export interface IPartialComment {
  productId: number;
  content: string;
  writer: string;
  numberOfStars: number;
  parentId: number | undefined;
}

export class CommentSchema {
  static async createComment(comment: IPartialComment) {
    try {
      const { productId, content, writer, numberOfStars, parentId } = comment;
      const createdAt = new Date();
      const [rows] = await pool.query<ResultSetHeader>(
        `
      insert into comment (productId, content, writer, numberOfStars, parentId, createdAt)
      values(?, ?, ?, ?, ?, ?)`,
        [productId, content, writer, numberOfStars, parentId, createdAt]
      );
      return rows.insertId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  static async getComments(productId: string) {
    const [comments] = await pool.query<RowDataPacket[]>(
      /*
      select c.commentId, c.writer, u.avatar, c.createdAt, c.numberOfUpvotes, c.numberOfDownVotes,
      c.numberOfStars, c.parentId
      from comment c, user u
      where c.productId = ? and c.writer = u.username
      order by c.createdAt desc;
      */
      `
      WITH RECURSIVE CommentHierarchy AS (
          -- Anchor member: Select top-level comments (parentId IS NULL)
          SELECT 
              c.commentId,
              c.content,
              c.createdAt,
              c.writer,
              c.parentId,
              c.numberOfUpvotes,
              c.numberOfDownvotes,
              c.numberOfStars,
              u.avatar,
              0 AS level
          FROM 
              comment c
          JOIN 
              user u ON c.writer = u.username
          WHERE 
              c.parentId IS NULL AND c.productId = ?

          UNION ALL

          -- Recursive member: Select replies for each comment
          SELECT 
              c.commentId,
              c.content,
              c.createdAt,
              c.writer,
              c.parentId,
              c.numberOfUpvotes,
              c.numberOfDownvotes,
              c.numberOfStars,
              u.avatar,
              ch.level + 1 AS level
          FROM 
              comment c
          JOIN 
              user u ON c.writer = u.username
          INNER JOIN 
              CommentHierarchy ch ON c.parentId = ch.commentId
      )
      -- Select from the recursive CTE
      SELECT 
          commentId,
          content,
          createdAt,
          writer,
          parentId,
          numberOfUpvotes,
          numberOfDownvotes,
          numberOfStars,
          avatar,
          level
      FROM 
          CommentHierarchy
      ORDER BY 
          createdAt DESC; -- or any other ordering criteria you prefer.
    `,
      [productId]
    );
    console.log(comments);

    let formattedComments: any = [];
    let tmpReplies: any = [];
    return comments[0].reduce((acc: any, curElem: any) => {
      const { parentId } = curElem;
      if (!parentId) {
        acc.push({
          data: curElem,
          replies: [...tmpReplies],
        });
        tmpReplies = [];
      } else {
        tmpReplies = [curElem, ...tmpReplies];
      }
      return acc;
    }, formattedComments);
  }

  static async upvote(commentId: string) {
    await pool.query(
      `
      update comment
      set numberOfUpvotes = numberOfUpvotes + 1
      where id = ?
    `,
      [commentId]
    );
  }
  static async downvote(commentId: string) {
    await pool.query(
      `
      update comment
      set numberOfDownVotes = numberOfDownVotes - 1
      where id = ?
    `,
      [commentId]
    );
  }
}
