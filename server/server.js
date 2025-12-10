const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();

// Force restart for AI update - Key Added
const app = express();
const server = http.createServer(app);

// Seed AI User for VITCHAT
const seedAIUser = async () => {
    try {
        const aiEmail = "ai@bot.com";
        const userExists = await User.findOne({ email: aiEmail });
        if (!userExists) {
            await User.create({
                name: "VITCHAT Bot",
                email: aiEmail,
                password: "ai_bot_secure_password",
                pic: "https://icon-library.com/images/robot-icon-png/robot-icon-png-28.jpg",
            });
            console.log("AI User Created for VITCHAT");
        } else {
            console.log("AI User already exists");
        }
    } catch (error) {
        console.error("Error seeding AI user:", error);
    }
};

// Connect DB then seed
connectDB().then(() => {
    seedAIUser();
});

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Vite default port
        methods: ["GET", "POST"],
    },
});

const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { generateAIResponse } = require('./ai/aiController');
const Message = require('./models/messageModel');
const Chat = require('./models/chatModel');
const User = require('./models/userModel');

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

app.use(notFound);
app.use(errorHandler);

// Socket.IO Connection
const onlineUsers = new Map(); // Map<socketId, userId>

io.on("connection", (socket) => {
    console.log("Connected to socket.io");

    socket.on("setup", (userData) => {
        socket.join(userData._id);
        onlineUsers.set(socket.id, userData._id); // Track user
        socket.emit("connected");

        // Broadcast online users
        io.emit("online users", Array.from(onlineUsers.values()));
    });

    socket.on("join chat", (room) => {
        socket.join(room);
        console.log("User Joined Room: " + room);
    });

    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.on("new message", async (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;

        if (!chat.users) return console.log("chat.users not defined");

        // ROBUSTNESS FIX: Fetch the chat fresh from DB to ensure users are populated correctly
        try {
            const freshChat = await Chat.findById(chat._id)
                .populate("users", "name pic email")
                .populate("groupAdmin", "-password");

            if (!freshChat) return;

            chat = freshChat; // Override with fresh data
        } catch (e) {
            console.log("Error fetching fresh chat in socket:", e);
        }

        // Broadcast to other users
        chat.users.forEach((user) => {
            if (user._id == newMessageRecieved.sender._id) return;
            socket.in(user._id).emit("message received", newMessageRecieved);
        });

        // AI CONFIGURATION: Check if AI is in the chat
        // We assume AI user has email "ai@bot.com"
        console.log("Checking for AI user in chat users:", chat.users.map(u => u.email));
        const aiUser = chat.users.find(u => u.email === "ai@bot.com");

        if (aiUser && newMessageRecieved.sender.email !== "ai@bot.com") {
            console.log("AI User found! Preparing response...");
            try {
                // Simulate thinking delay
                setTimeout(async () => {
                    const aiReply = await generateAIResponse(chat._id, newMessageRecieved.content);

                    // Save AI Message to DB
                    var newAiMessage = {
                        sender: aiUser._id,
                        content: aiReply,
                        chat: chat._id,
                    };

                    var message = await Message.create(newAiMessage);
                    message = await message.populate("sender", "name pic");
                    message = await message.populate("chat");
                    message = await User.populate(message, {
                        path: "chat.users",
                        select: "name pic email",
                    });

                    await Chat.findByIdAndUpdate(chat._id, { latestMessage: message });

                    // Emit to the chat room directly
                    io.in(String(chat._id)).emit("message received", message);

                }, 2000); // 2s delay
            } catch (error) {
                console.log("AI Response Error:", error);
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("USER DISCONNECTED");
        onlineUsers.delete(socket.id);
        io.emit("online users", Array.from(onlineUsers.values()));
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
