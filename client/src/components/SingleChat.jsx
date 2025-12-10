import { FormControl } from "@chakra-ui/react";
import { Input } from "@chakra-ui/react";
import { Box, Text } from "@chakra-ui/react";
import "./styles.css";
import { IconButton, Spinner, useToast } from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowBackIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import animationData from "../animations/typing.json";

import io from "socket.io-client";
import { ChatState } from "../context/ChatProvider";
import EmojiPicker from "emoji-picker-react";

const ENDPOINT = "http://localhost:5000";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [socketConnected, setSocketConnected] = useState(false);
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const toast = useToast();

    const { selectedChat, setSelectedChat, user, notification, setNotification, chats, setChats } =
        ChatState();

    const fetchMessages = async () => {
        if (!selectedChat) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            setLoading(true);

            const { data } = await axios.get(
                `http://localhost:5000/api/message/${selectedChat._id}`,
                config
            );
            setMessages(data);
            setLoading(false);

            socket.emit("join chat", selectedChat._id);
        } catch (error) {
            toast({
                title: "Error Occured!",
                description: "Failed to Load the Messages",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
        }
    };

    const sendMessage = async (event) => {
        if (event.key === "Enter" && newMessage) {
            socket.emit("stop typing", selectedChat._id);
            try {
                const config = {
                    headers: {
                        "Content-type": "application/json",
                        Authorization: `Bearer ${user.token}`,
                    },
                };
                setNewMessage("");
                const { data } = await axios.post(
                    "http://localhost:5000/api/message",
                    {
                        content: newMessage,
                        chatId: selectedChat._id,
                    },
                    config
                );
                socket.emit("new message", data);
                setMessages([...messages, data]);
            } catch (error) {
                toast({
                    title: "Error Occured!",
                    description: "Failed to send the Message",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom",
                });
            }
        }
    };

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
        socket.on("connected", () => setSocketConnected(true));
        socket.on("typing", () => setIsTyping(true));
        socket.on("stop typing", () => setIsTyping(false));
    }, []);

    useEffect(() => {
        fetchMessages();
        selectedChatCompare = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
        const messageHandler = (newMessageRecieved) => {
            console.log("Msg received in SingleChat:", newMessageRecieved);
            if (
                !selectedChatCompare ||
                selectedChatCompare._id !== newMessageRecieved.chat._id
            ) {
                if (!notification.includes(newMessageRecieved)) {
                    setNotification([newMessageRecieved, ...notification]);
                    setFetchAgain(!fetchAgain);
                }
            } else {
                setMessages((prevMessages) => [...prevMessages, newMessageRecieved]);
            }
        };

        socket.on("message received", messageHandler);

        return () => {
            socket.off("message received", messageHandler);
        };
    }, [selectedChatCompare]); // Dependency ensuring cleaner handling? Or use empty and Refs?
    // Note: using functional update for setMessages helps avoid dependency on 'messages'
    // But selectedChatCompare is needed. This might re-subscribe often but cleans up.

    const handlePromptClick = async (promptText) => {
        setNewMessage(promptText);

        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            // 1. Search for AI User
            const { data: searchResults } = await axios.get(`http://localhost:5000/api/user?search=ai@bot.com`, config);
            const aiUser = searchResults.find(u => u.email === "ai@bot.com");

            if (aiUser) {
                // 2. Access/Create Chat with AI
                const { data: chatData } = await axios.post(`http://localhost:5000/api/chat`, { userId: aiUser._id }, config);

                if (!chats) {
                    setChats([chatData]);
                } else if (!chats.find((c) => c._id === chatData._id)) {
                    setChats([chatData, ...chats]);
                }
                setSelectedChat(chatData);

                // 3. Send Message (Wait a bit for state to update or just send directly via API)
                // We'll call sendMessage logic manually here to ensure it uses the correct chat ID immediately
                const msgConfig = {
                    headers: {
                        "Content-type": "application/json",
                        Authorization: `Bearer ${user.token}`,
                    },
                };

                const { data: msgData } = await axios.post(
                    "http://localhost:5000/api/message",
                    {
                        content: promptText,
                        chatId: chatData._id,
                    },
                    msgConfig
                );

                socket.emit("new message", msgData);
                setMessages([...messages, msgData]);
                setNewMessage(""); // Clear after sending
            } else {
                toast({
                    title: "AI User Not Found",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom",
                });
            }
            setLoading(false);
        } catch (error) {
            toast({
                title: "Error starting AI chat",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
        }
    };

    const typingHandler = (e) => {
        setNewMessage(e.target.value);

        if (!socketConnected) return;

        if (!typing) {
            setTyping(true);
            if (selectedChat) socket.emit("typing", selectedChat._id);
        }
        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        setTimeout(() => {
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= timerLength && typing) {
                socket.emit("stop typing", selectedChat._id);
                setTyping(false);
            }
        }, timerLength);
    };

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prev => prev + emojiObject.emoji);
    };

    return (
        <Box w="100%" h="100%" display="flex" flexDirection="column">
            {selectedChat ? (
                <>
                    {/* Header */}
                    <Box
                        p={3}
                        w="100%"
                        borderBottom="1px solid var(--border-color)"
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        color="var(--text-primary)"
                    >
                        <IconButton
                            d={{ base: "flex", md: "none" }}
                            icon={<ArrowBackIcon />}
                            onClick={() => setSelectedChat("")}
                            variant="ghost"
                            color="var(--text-primary)"
                        />
                        <Text fontSize={{ base: "28px", md: "20px" }} fontFamily="Work sans">
                            {!selectedChat.isGroupChat ? (
                                <>
                                    {getSender(user, selectedChat.users)}
                                    <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                                </>
                            ) : (
                                <>{selectedChat.chatName.toUpperCase()}</>
                            )}
                        </Text>
                    </Box>

                    {/* Chat Area */}
                    <Box
                        display="flex"
                        flexDir="column"
                        justifyContent="flex-end"
                        p={3}
                        bg="transparent"
                        w="100%"
                        h="100%"
                        overflowY="hidden"
                    >
                        {loading ? (
                            <Spinner
                                size="xl"
                                w={20}
                                h={20}
                                alignSelf="center"
                                margin="auto"
                                color="var(--text-secondary)"
                            />
                        ) : (
                            <div className="messages" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'scroll' }}>
                                <ScrollableChat messages={messages} />
                            </div>
                        )}

                        <FormControl onKeyDown={sendMessage} isRequired mt={3} width="100%" px={5} alignSelf="center">
                            {isTyping ? <div style={{ color: 'var(--text-secondary)', marginBottom: 5 }}>Typing...</div> : <></>}

                            <Box
                                bg="var(--bg-input)"
                                borderRadius="xl"
                                display="flex"
                                alignItems="center"
                                p={1}
                                boxShadow="0 0 15px rgba(0,0,0,0.1)"
                                border="1px solid var(--border-color)"
                            >
                                <Input
                                    variant="unstyled"
                                    bg="transparent"
                                    placeholder="Send a message..."
                                    value={newMessage}
                                    onChange={typingHandler}
                                    p={3}
                                    color="var(--text-primary)"
                                    _placeholder={{ color: 'var(--text-placeholder)' }}
                                />
                                <IconButton
                                    aria-label="Send"
                                    icon={<ArrowBackIcon transform="rotate(90deg)" />} // Using existing icon rotated as send
                                    size="sm"
                                    bg="transparent"
                                    color={newMessage ? "var(--text-primary)" : "var(--text-placeholder)"}
                                    _hover={{ bg: "transparent" }}
                                    onClick={() => sendMessage({ key: "Enter" })}
                                />
                            </Box>
                            <Text fontSize="xs" color="var(--text-secondary)" textAlign="center" mt={2}>
                                ChatBot can check logic errors.
                            </Text>
                        </FormControl>
                    </Box>
                </>
            ) : (
                <Box d="flex" alignItems="center" justify="center" h="100%" flexDir="column" color="var(--text-primary)" p={5}>
                    <Box flex={1} d="flex" flexDirection="column" alignItems="center" justify="center" w="100%">
                        <Text
                            fontSize="5xl"
                            mb={8}
                            fontWeight="extrabold"
                            bgGradient="linear(to-r, #00B4DB, #0083B0, #7928CA)"
                            bgClip="text"
                        >
                            VITCHAT
                        </Text>
                        {/* Functional Prompts */}
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                            <Box
                                as="button"
                                onClick={() => handlePromptClick("Plan a 3-day trip to Seattle")}
                                fontSize="sm"
                                bg="var(--bg-secondary)"
                                p={4}
                                borderRadius="md"
                                cursor="pointer"
                                _hover={{
                                    bgGradient: "linear(to-r, #7928CA, #FF0080)",
                                    color: "white",
                                    transform: "scale(1.05)"
                                }}
                                transition="all 0.2s"
                                border="1px solid var(--border-color)"
                            >
                                "Plan a 3-day trip to Seattle"
                            </Box>
                            <Box
                                as="button"
                                onClick={() => handlePromptClick("How do I make an HTTP request in Javascript?")}
                                fontSize="sm"
                                bg="var(--bg-secondary)"
                                p={4}
                                borderRadius="md"
                                cursor="pointer"
                                _hover={{
                                    bgGradient: "linear(to-r, #FF0080, #7928CA)",
                                    color: "white",
                                    transform: "scale(1.05)"
                                }}
                                transition="all 0.2s"
                                border="1px solid var(--border-color)"
                            >
                                "How do I make an HTTP request in Javascript?"
                            </Box>
                        </div>
                    </Box>

                    {/* New Chat Input Area */}
                    <Box w="100%" px={5}>
                        <Box
                            bg="var(--bg-input)"
                            borderRadius="xl"
                            display="flex"
                            alignItems="center"
                            p={2}
                            boxShadow="0 0 15px rgba(0,0,0,0.1)"
                            border="1px solid var(--border-color)"
                        >
                            {/* File Upload Logic */}
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="image-upload"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;

                                    const formData = new FormData();
                                    formData.append('image', file);

                                    try {
                                        setLoading(true);
                                        const config = {
                                            headers: {
                                                'Content-Type': 'multipart/form-data',
                                                Authorization: `Bearer ${user.token}`,
                                            },
                                        };
                                        const { data } = await axios.post('http://localhost:5000/api/message/upload', formData, config);

                                        // Send the image URL as a message
                                        handlePromptClick(data); // Re-use handlePromptClick to send the message
                                        setLoading(false);
                                    } catch (error) {
                                        toast({
                                            title: "Error Uploading Image",
                                            status: "error",
                                            duration: 3000,
                                            isClosable: true,
                                        });
                                        setLoading(false);
                                    }
                                }}
                            />
                            <IconButton
                                aria-label="Upload File"
                                icon={<span style={{ fontSize: "20px" }}>+</span>}
                                size="sm"
                                variant="ghost"
                                color="var(--text-secondary)"
                                _hover={{ bg: "var(--bg-secondary)", color: "var(--text-primary)" }}
                                mr={1}
                                onClick={() => document.getElementById('image-upload').click()}
                            />

                            {/* Emoji Picker */}
                            <Box position="relative">
                                <IconButton
                                    aria-label="Emoji Picker"
                                    icon={<span style={{ fontSize: "20px" }}>😊</span>}
                                    size="sm"
                                    variant="ghost"
                                    color="var(--text-secondary)"
                                    _hover={{ bg: "var(--bg-secondary)", color: "var(--text-primary)" }}
                                    onClick={() => setShowPicker(!showPicker)}
                                    mr={2}
                                />
                                {showPicker && (
                                    <Box position="absolute" bottom="50px" left="0" zIndex="10">
                                        <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                                    </Box>
                                )}
                            </Box>

                            {/* Voice Recorder */}
                            <IconButton
                                aria-label="Voice Note"
                                icon={<span style={{ fontSize: "20px" }}>{isRecording ? "🛑" : "🎤"}</span>}
                                size="sm"
                                variant="ghost"
                                color={isRecording ? "red.400" : "var(--text-secondary)"}
                                _hover={{ bg: "var(--bg-secondary)", color: "var(--text-primary)" }}
                                mr={2}
                                onClick={async () => {
                                    if (!isRecording) {
                                        try {
                                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                            const mediaRecorder = new MediaRecorder(stream);
                                            setMediaRecorder(mediaRecorder);

                                            mediaRecorder.start();
                                            setIsRecording(true);

                                            const audioChunks = [];
                                            mediaRecorder.addEventListener("dataavailable", event => {
                                                audioChunks.push(event.data);
                                            });

                                            mediaRecorder.addEventListener("stop", async () => {
                                                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                                                const audioFile = new File([audioBlob], "voice_note.webm", { type: "audio/webm" });

                                                const formData = new FormData();
                                                formData.append('image', audioFile); // Re-using 'image' field for uploads

                                                try {
                                                    setLoading(true);
                                                    const config = {
                                                        headers: {
                                                            'Content-Type': 'multipart/form-data',
                                                            Authorization: `Bearer ${user.token}`,
                                                        },
                                                    };
                                                    const { data } = await axios.post('http://localhost:5000/api/message/upload', formData, config);
                                                    handlePromptClick(data);
                                                    setLoading(false);
                                                } catch (error) {
                                                    toast({
                                                        title: "Error Sending Audio",
                                                        status: "error",
                                                        duration: 3000,
                                                        isClosable: true,
                                                    });
                                                    setLoading(false);
                                                }
                                            });

                                        } catch (err) {
                                            console.error("Error accessing microphone:", err);
                                            toast({
                                                title: "Microphone Access Denied",
                                                status: "error",
                                                duration: 3000,
                                                isClosable: true,
                                            });
                                        }
                                    } else {
                                        mediaRecorder.stop();
                                        setIsRecording(false);
                                    }
                                }}
                            />
                            <Input
                                variant="unstyled"
                                bg="transparent"
                                placeholder="Message VITCHAT..."
                                value={newMessage}
                                onChange={typingHandler}
                                onKeyDown={(e) => e.key === "Enter" && newMessage && handlePromptClick(newMessage)}
                                p={2}
                                color="var(--text-primary)"
                                _placeholder={{ color: 'var(--text-placeholder)' }}
                            />
                            <IconButton
                                aria-label="Send"
                                icon={<ArrowBackIcon transform="rotate(90deg)" />}
                                size="sm"
                                bg="transparent"
                                color="var(--text-placeholder)"
                                _hover={{ bg: "transparent" }}
                                onClick={() => newMessage && handlePromptClick(newMessage)}
                            />
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default SingleChat;
