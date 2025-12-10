import { Avatar } from "@chakra-ui/react";
import { Tooltip } from "@chakra-ui/react";
import ScrollableFeed from "react-scrollable-feed";
import {
    isLastMessage,
    isSameSender,
    isSameSenderMargin,
    isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";

const ScrollableChat = ({ messages }) => {
    const { user } = ChatState();

    return (
        <ScrollableFeed className="messages">
            {messages &&
                messages.map((m, i) => (
                    <div style={{ display: "flex", padding: "10px 0" }} key={m._id}>
                        {(isSameSender(messages, m, i, user._id) ||
                            isLastMessage(messages, i, user._id)) && (
                                <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                                    <Avatar
                                        mt="7px"
                                        mr={1}
                                        size="sm"
                                        cursor="pointer"
                                        name={m.sender.name}
                                        src={m.sender.pic}
                                    />
                                </Tooltip>
                            )}
                        <span
                            style={{
                                backgroundColor: `${m.sender._id === user._id ? "transparent" : "var(--bg-input)"
                                    }`,
                                color: "var(--text-primary)",
                                marginLeft: isSameSenderMargin(messages, m, i, user._id),
                                marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                                borderRadius: "5px",
                                padding: "10px 15px",
                                maxWidth: "75%",
                            }}
                        >
                            {m.content.includes("uploads") && (m.content.match(/\.(jpeg|jpg|png)$/i)) ? (
                                <img
                                    src={`http://localhost:5000${m.content.replace(/\\/g, "/")}`}
                                    alt="Uploaded Content"
                                    style={{ borderRadius: "10px", marginTop: "5px", maxWidth: "250px" }}
                                />
                            ) : m.content.includes("uploads") && (m.content.match(/\.(webm|mp3|wav)$/i)) ? (
                                <audio controls src={`http://localhost:5000${m.content.replace(/\\/g, "/")}`} style={{ marginTop: "5px", maxWidth: "250px" }} />
                            ) : (
                                m.content
                            )}
                        </span>
                    </div>
                ))}
        </ScrollableFeed>
    );
};

export default ScrollableChat;
