import { StatusCodes } from "http-status-codes";
import { ChatSchema } from "../models/chat.model.js";
import { Request, Response } from "express";
import { pusherServer } from "../config/pusher.js";

export const getChatrooms = async (req, res: Response) => {
  try {
    const username = req.user.username;
    const chatrooms = await ChatSchema.getAllChatrooms(username);
    res.status(StatusCodes.OK).send(chatrooms);
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: "Internal Server Error" });
  }
};

export const getMessages = async (req, res: Response) => {
  try {
    const { chatroomId } = req.params;
    const messages = await ChatSchema.getMessages(Number(chatroomId));
    res.status(StatusCodes.OK).send(messages);
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: "Internal Server Error" });
  }
};

export const createMessage = async (req, res: Response) => {
  try {
    const message = req.body;
    const newMessage = await ChatSchema.createMessage(message);
    newMessage.senderAvatar = req.user.avatar;
    newMessage.senderName = req.user.name;
    pusherServer.trigger(message.receiver, 'incoming-message', newMessage);
    res.status(StatusCodes.OK).send(newMessage);
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: "Internal Server Error" });
  }
}

export const checkNewMessage = async (req, res: Response) => {
  try {
    const username = req.user.username;
    const result = await ChatSchema.checkNewMessage(username);
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: "Internal Server Error" });
  }
}

export const changeToRead = async (req, res: Response) => {
  try {
    const { chatroomId } = req.params;
    const result = await ChatSchema.changeToRead(chatroomId);
    res.status(StatusCodes.OK).send();
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: "Internal Server Error" });
  }
}