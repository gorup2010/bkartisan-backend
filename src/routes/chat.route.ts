import { Router } from "express";
import { changeToRead, checkNewMessage, createMessage, getChatrooms, getMessages } from "../controllers/chat.js";
import { authorize } from "../utils/authorize.js";
import { pusherServer } from "../config/pusher.js";

export const chatRouter = Router();

// chatRouter.post("/pusher/auth", (request, response) => {
//   const socketId = request.body.socket_id;
//   const channel = request.body.channel_name;
//   const presenceData = {
//     user_id: request.user.username,
//     user_info: {
//       fullname: request.user.name,
//     },
//   };
//   const auth = pusherServer.authorizeChannel(socketId, channel, presenceData);
//   response.send(auth);
// });

chatRouter.get("/check-new-messages", authorize, checkNewMessage)
chatRouter.get("/chatrooms", authorize, getChatrooms);
chatRouter.get(`/messages/:chatroomId`, authorize, getMessages);
chatRouter.post("/messages", authorize, createMessage)
chatRouter.patch("/chatrooms/:chatroomId/read", changeToRead)

export default chatRouter;

