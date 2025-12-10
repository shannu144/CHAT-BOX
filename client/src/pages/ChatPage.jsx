import { Box } from "@chakra-ui/react";
import { useState } from "react";
import ChatBox from "../components/ChatBox";
import MyChats from "../components/MyChats";
import SideDrawer from "../components/miscellaneous/SideDrawer";
import { ChatState } from "../context/ChatProvider";

const ChatPage = () => {
    const { user, selectedChat } = ChatState();
    const [fetchAgain, setFetchAgain] = useState(false);

    return (
        <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
            {user && <SideDrawer />}
            <Box display="flex" flex="1" w="100%" h="91.5vh" overflow="hidden">
                {user && (
                    <Box
                        display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
                        w={{ base: "100%", md: "320px" }}
                        h="100%"
                        bg="var(--bg-secondary)"
                        flexDir="column"
                    >
                        <MyChats fetchAgain={fetchAgain} />
                    </Box>
                )}
                {user && (
                    <Box
                        display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
                        flex="1"
                        h="100%"
                        bg="var(--bg-primary)"
                        position="relative"
                        flexDir="column"
                    >
                        <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
                    </Box>
                )}
            </Box>
        </div>
    );
};

export default ChatPage;
