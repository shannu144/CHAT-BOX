import { Box } from "@chakra-ui/react";
import "./styles.css";
import SingleChat from "./SingleChat";
import { ChatState } from "../context/ChatProvider";

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
    const { selectedChat } = ChatState();

    return (
        <Box
            d={{ base: selectedChat ? "flex" : "none", md: "flex" }}
            alignItems="center"
            flexDir="column"
            p={0}
            bg="transparent" // Transparent to show main background
            w={{ base: "100%", md: "100%" }}
            h="100%"
            borderRadius="0"
            borderWidth="0px"
        >
            <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        </Box>
    );
};

export default ChatBox;
