import pool from "../config/sqlconnect.js";

export interface IChatroom {
  roomId: number;
  username1: string;
  username2: string;
  lastMsg: string;
  lastUser: string;
  lastUpdate: Date;
}

export class ChatSchema {
  static async getAllChatrooms(username: string) {
    const sql = `
        select chatroomId, lastMsg, lastUser, lastUpdate, isReceiverRead,
        CASE 
            WHEN cr.username1 = ? THEN u2.name
            ELSE u1.name
        END AS name,
        CASE 
            WHEN cr.username1 = ? THEN u2.avatar
            ELSE u1.avatar
        END AS avatar,
        CASE 
            WHEN cr.username1 = ? THEN u2.username
            ELSE u1.username
        END AS username
        from chat_room cr
        left join user u1 on username1 = u1.username 
        left join user u2 on username2 = u2.username 
        where username1 = ? or username2 = ?
        order by lastUpdate desc;
    `;
    const values = [username, username, username, username, username];

    const [res] = await pool.query(sql, values);
    return res;
  }
  static async getMessages(chatroomId: number) {
    const [res] = await pool.query(
      `select * from message where room = ? order by createdAt asc`,
      chatroomId
    );
    return res;
  }
  static async createMessage({ sender, receiver, content, chatroomId }) {
    //Thực hiện cập nhật chat_room rồi mới tạo message mới
    let sql = "START TRANSACTION; ";
    const values = [];
    const createdAt = new Date();

    // 2 người dùng đã từng nhắn với nhau
    if (chatroomId) {
      sql += `
        update chat_room set lastMsg = ?, lastUser = ?, lastUpdate = ?, isReceiverRead = false where chatroomId = ?; 
        insert into message(room, sender, receiver, content, createdAt) values (?,?,?,?,?);
        select * from message where msgId = LAST_INSERT_ID();
        commit;
        `;
      values.push(
        content,
        sender,
        createdAt,
        chatroomId,
        chatroomId,
        sender,
        receiver,
        content,
        createdAt
      );
    }
    // 2 người dùng chưa từng nhắn với nhau bao giờ. Tạo chat_room mới.
    else {
      sql += `
        insert into chat_room(username1, username2, lastMsg, lastUser, lastUpdate, isReceiverRead) values (?,?,?,?,?,false); 
        insert into message(room, sender, receiver, content, createdAt) values (LAST_INSERT_ID(),?,?,?,?);
        select * from message where msgId = LAST_INSERT_ID();
        commit;
        `;
      values.push(
        sender,
        receiver,
        content,
        sender,
        createdAt,
        sender,
        receiver,
        content,
        createdAt
      );
    }

    const [res] = await pool.query(sql, values);
    let newMessage = res[3][0];
    console.log(newMessage);
    return newMessage;
  }
  static async checkChatroomExist(sender, receiver) {
    const [res] = await pool.query(
      `
      select * from chat_room where (username1 = ? and username2=?) or (username1 = ? and username2 = ?)
    `,
      [sender, receiver, receiver, sender]
    );
    return res[0];
  }
  static async checkNewMessage(username) {
    const [res] = await pool.query({
      sql: `
      select chatroomId from chat_room 
      where (username1 = ? or username2 = ?) and lastUser != ? and isReceiverRead = false;
    `,
      values: [username, username, username],
    });
    return res;
  }
  static async changeToRead(chatroomId) {
    const [res] = await pool.query({
      sql: `
      update chat_room set isReceiverRead = true where chatroomId = ?;
    `,
      values: [chatroomId],
    });
    return res;
  }
}
