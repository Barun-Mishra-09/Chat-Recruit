import cloudinary from "../lib/cloudinary.js";
import { getReceiveSocketId, io } from "../lib/socket.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.id;

    const otherUsers = await User.find({ _id: { $ne: loggedInUserId } }).select(
      "-password"
    );

    return res.status(200).json({
      message: "Other users fetched successfully",
      success: true,
      otherUsers,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const myId = req.id;
    const { id: userToChatId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

export const sendMessages = async (req, res) => {
  try {
    const { text } = req.body;
    const senderId = req.id;
    const { id: receiverId } = req.params;

    console.log(`Sending message from ${senderId} to ${receiverId}`);
    console.log(`Message text: ${text || 'No text'}, Has media: ${req.file ? 'Yes' : 'No'}`);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? `${req.file.mimetype}, size: ${req.file.size} bytes` : 'No file');

    let mediaData = null;

    if (req.file) {
      console.log(`Processing media file: ${req.file.mimetype}, size: ${req.file.size} bytes`);
      const bufferStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      
      try {
        const uploadResponse = await cloudinary.uploader.upload(bufferStr, {
          resource_type: "auto",
        });

        console.log(`Media uploaded to Cloudinary: ${uploadResponse.secure_url}`);
        
        mediaData = {
          url: uploadResponse.secure_url,
          type: req.file.mimetype.startsWith("image")
            ? "image"
            : req.file.mimetype.startsWith("video")
            ? "video"
            : "file",
        };
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError);
        return res.status(500).json({
          message: "Failed to upload media",
          success: false,
          error: cloudinaryError.message
        });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      media: mediaData,
    });

    await newMessage.save();
    console.log(`Message saved to database with ID: ${newMessage._id}`);

    // Get the socket ID of the receiver
    const receiverSocketId = getReceiveSocketId(receiverId);
    
    // Get the socket ID of the sender
    const senderSocketId = getReceiveSocketId(senderId);
    
    console.log(`Receiver socket ID: ${receiverSocketId || 'Not online'}`);
    console.log(`Sender socket ID: ${senderSocketId || 'Not online'}`);
    
    // Broadcast the message to all connected clients
    // This ensures all instances of the application receive the message in real-time
    console.log(`Broadcasting new message to all connected clients`);
    io.emit("newMessage", newMessage);
    
    // Log specific delivery attempts
    if (receiverSocketId) {
      console.log(`Receiver socket is online: ${receiverSocketId}`);
    }
    
    if (senderSocketId) {
      console.log(`Sender socket is online: ${senderSocketId}`);
    }

    return res.status(201).json({
      success: true,
      newMessage,
    });
  } catch (error) {
    console.error("Error in sendMessages:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message
    });
  }
};
