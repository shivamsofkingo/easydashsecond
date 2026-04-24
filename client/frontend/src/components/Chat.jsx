import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";

const Chat = ({ token, email }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [usersOnChatPage, setUsersOnChatPage] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]); // Ensure conversations is initialized as an empty array
  const [currentChat, setCurrentChat] = useState(null);

  useEffect(() => {
    const setupSocket = async () => {
      const response = await axios.get(`http://localhost:8000/api/user/getUserByEmail?email=${email}`);
      const userId = response.data.payload.user._id;
      console.log("userID ====> ", userId);
      const newSocket = io("http://localhost:8000", {
        query: { userId },
      });

      newSocket.on("connect", () => {
        console.log("Connected to socket server with ID:", newSocket.id);
      });

      newSocket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      newSocket.emit("insideMessageUser", userId);
//--------------------------------------------------------------------------------------------------------
      const adsId = "kjhwr5349023u52b5n235ui"; 
      const receiverId = "6719d458c9715e4edc0264c9"; 
      const senderId = "674ea63f5eed7119f5bf2416";
      newSocket.emit("joinRoom", { adsId, receiverId, senderId });
//--------------------------------------------------------------------------------------------------------
      newSocket.on("newMessage", (newMessage, roomId, unreadMessageCount) => {
        console.log("newMessages =============> ", newMessage)
        console.log("roomId =============> ", roomId)
        console.log("unreadMessageCount =============> ", unreadMessageCount)
      });
//--------------------------------------------------------------------------------------------------------
      setSocket(newSocket);
      return () => newSocket.close();
    };

    setupSocket();
    fetchUserConversations();
  }, [email]);

  const fetchUserConversations = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`http://localhost:8000/api/message/conversations/${userId}`, {
        headers,
      });
      
      // Ensure the response is an array and set to state
      if (response.data.status === 1 && Array.isArray(response.data.payload)) {
        setConversations(response.data.payload);
      } else {
        setConversations([]); // Default to an empty array if data is unexpected
      }
    } catch (error) {
      console.log("Error fetching conversations:", error.message);
      setConversations([]); // Default to an empty array in case of an error
    }
  };

  const selectChat = (conversation) => {
    setCurrentChat(conversation);
    setMessages(conversation.messages);

    socket.emit("joinRoom", {
      adsId: conversation.adsId._id,
      buyerId: conversation.participants[0]._id,
      sellerId: conversation.participants[1]._id,
    });
  };

  const handleMessageSend = async () => {
    if (message && currentChat) {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.post(
          `http://localhost:8000/api/message/send/${currentChat.participants[1]._id}`,
          { message, adsId: currentChat.adsId._id },
          { headers }
        );
        if (response.data.status === 1) {
          socket.emit("sendMessage", {
            adsId: currentChat.adsId._id,
            receiverId: currentChat.participants[1]._id,
            message: response.data.payload.newMessage,
          });
          setMessage("");
        }
      } catch (error) {
        console.log("Error sending message:", error.message);
      }
    }
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Chat Conversations</h2>
      <div>
        <h4>Chat List:</h4>
        <ul>
          {conversations.map((conversation) => (
            <li key={conversation._id} onClick={() => selectChat(conversation)}>
              {conversation.adsId.title} with {conversation.participants[1].name}
            </li>
          ))}
        </ul>
      </div>

      {currentChat && (
        <>
          <h2>Chat for {currentChat.adsId.title}</h2>
          <div style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "1rem" }}>
            <h4>Messages</h4>
            {messages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.senderId === email ? "You" : "Other"}:</strong> {msg.message}
              </div>
            ))}
          </div>
          <input
            type="text"
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={handleMessageSend}>Send</button>
        </>
      )}
    </div>
  );
};

export default Chat;
