import Chat from "../models/chat.js";
import UserChats from "../models/userChats.js";

export const handleCreateChat = async (userId, text) => {
  const newChat = await Chat.create({
    userId,
    history: [{ role: "user", parts: [{ text }] }],
  });

  const userChats = await UserChats.findOne({ userId });

  if (!userChats) {
    await UserChats.create({
      userId,
      chats: [
        {
          _id: newChat._id,
          title: text.substring(0, 40),
        },
      ],
    });
  } else {
    await UserChats.updateOne(
      { userId },
      {
        $push: {
          chats: {
            _id: newChat._id,
            title: text.substring(0, 40),
          },
        },
      }
    );
  }

  return newChat._id;
};

export const handleUpdateChat = async (
  userId,
  chatId,
  question,
  answer,
  img
) => {
  const newItems = [
    ...(question
      ? [{ role: "user", parts: [{ text: question, ...(img && { img }) }] }]
      : []),
    { role: "model", parts: [{ text: answer }] },
  ];

  return await Chat.findOneAndUpdate(
    { _id: chatId, userId },
    { $push: { history: { $each: newItems } } },
    { new: true }
  );
};

export const handleDeleteChat = async (userId, chatId) => {
  await Chat.deleteOne({ _id: chatId, userId });
  await UserChats.updateOne({ userId }, { $pull: { chats: { _id: chatId } } });
};
