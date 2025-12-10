import { AddIcon } from "@chakra-ui/icons";
import { Box, Stack, Text, Button } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { getSender } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
// import GroupChatModal from "./miscellaneous/GroupChatModal";
import { ChatState } from "../context/ChatProvider";

const MyChats = ({ fetchAgain }) => {
    const [loggedUser, setLoggedUser] = useState();
    const { selectedChat, setSelectedChat, user, chats, setChats, onlineUsers } = ChatState();
    const toast = useToast();

    const fetchChats = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.get("http://localhost:5000/api/chat", config);
            setChats(data);
        } catch (error) {
            toast({
                title: "Error Occured!",
                description: "Failed to Load the chats",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-left",
            });
        }
    };

    useEffect(() => {
        setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
        fetchChats();
        // eslint-disable-next-line
    }, [fetchAgain]);

    return (
        <Box
            d={{ base: selectedChat ? "none" : "flex", md: "flex" }}
            flexDir="column"
            alignItems="center"
            p={3}
            bg="var(--bg-secondary)" // Dark sidebar background
            w={{ base: "100%", md: "100%" }} // Full width of parent container
            h="100%"
            borderRight="1px solid var(--border-color)"
        >
            <Box
                pb={3}
                px={3}
                fontSize="20px"
                fontFamily="Work sans"
                color="var(--text-primary)"
                d="flex"
                w="100%"
                justifyContent="space-between"
                alignItems="center"
            >
                My Chats
            </Box>

            <Box
                d="flex"
                flexDir="column"
                p={2}
                bg="transparent"
                w="100%"
                h="100%"
                overflowY="hidden"
            >
                {chats ? (
                    <Stack overflowY="scroll" spacing={2} sx={{
                        '&::-webkit-scrollbar': {
                            width: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: 'var(--border-color)',
                            borderRadius: '24px',
                        },
                    }}>
                        {chats.map((chat) => (
                            <Box
                                onClick={() => setSelectedChat(chat)}
                                cursor="pointer"
                                bg={selectedChat === chat ? "var(--bg-input)" : "transparent"}
                                color="var(--text-primary)"
                                px={3}
                                py={3}
                                borderRadius="md"
                                key={chat._id}
                                _hover={{ bg: "var(--bg-input)" }}
                                transition="background 0.2s"
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Text fontSize="sm">
                                    {!chat.isGroupChat
                                        ? getSender(loggedUser, chat.users)
                                        : chat.chatName}
                                </Text>
                                {!chat.isGroupChat && (
                                    <Box
                                        w={3}
                                        h={3}
                                        borderRadius="full"
                                        bg={onlineUsers.includes(chat.users.find((u) => u._id !== loggedUser._id)?._id) ? "green.400" : "transparent"}
                                        ml={2}
                                    />
                                )}
                            </Box>
                        ))}
                    </Stack>
                ) : (
                    <ChatLoading />
                )}
            </Box>
        </Box >
    );
};

export default MyChats;
