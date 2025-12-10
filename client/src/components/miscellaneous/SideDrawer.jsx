import { Button } from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import { Input } from "@chakra-ui/react";
import { Box, Text } from "@chakra-ui/react";
import {
    Menu,
    MenuButton,
    MenuDivider,
    MenuItem,
    MenuList,
} from "@chakra-ui/react";
import {
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
} from "@chakra-ui/react";
import { Tooltip } from "@chakra-ui/react";
import { BellIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Avatar } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useToast } from "@chakra-ui/react";
import ChatLoading from "../ChatLoading";
import { Spinner } from "@chakra-ui/react";
import ProfileModal from "./ProfileModal";
import UserListItem from "../UserAvatar/UserListItem";
import { ChatState } from "../../context/ChatProvider";
import SettingsModal from "./SettingsModal";

const SideDrawer = () => {
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);

    const {
        setSelectedChat,
        user,
        chats,
        setChats,
    } = ChatState();

    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const navigate = useNavigate();

    const logoutHandler = () => {
        localStorage.removeItem("userInfo");
        navigate("/");
    };

    const handleSearch = async () => {
        if (!search) {
            toast({
                title: "Please Enter something in search",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "top-left",
            });
            return;
        }

        try {
            setLoading(true);

            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.get(`http://localhost:5000/api/user?search=${search}`, config);

            setLoading(false);
            setSearchResult(data);
        } catch (error) {
            toast({
                title: "Error Occured!",
                description: "Failed to Load the Search Results",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-left",
            });
        }
    };

    const accessChat = async (userId) => {
        try {
            setLoadingChat(true);
            const config = {
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.post(`http://localhost:5000/api/chat`, { userId }, config);

            if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
            setSelectedChat(data);
            setLoadingChat(false);
            onClose();
        } catch (error) {
            toast({
                title: "Error fetching the chat",
                description: error.message,
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-left",
            });
        }
    };

    return (
        <>
            <Box
                d="flex"
                justifyContent="space-between"
                alignItems="center"
                bg="var(--bg-secondary)"
                w="100%"
                p="5px 10px 5px 10px"
                borderWidth="5px"
                borderColor="var(--bg-secondary)"
            >
                <Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
                    <Button variant="ghost" onClick={onOpen} color="var(--text-primary)" _hover={{ bg: "var(--bg-input)" }}>
                        <i className="fas fa-search"></i>
                        <Text d={{ base: "none", md: "flex" }} px={4}>
                            Search User
                        </Text>
                    </Button>
                </Tooltip>
                <Text
                    fontSize="2xl"
                    fontFamily="Work sans"
                    bgGradient="linear(to-l, #7928CA, #FF0080)"
                    bgClip="text"
                    fontWeight="bold"
                >
                    VITCHAT
                </Text>
                <div>
                    <Menu>
                        <MenuButton as={Button} bg="transparent" rightIcon={<ChevronDownIcon />} color="var(--text-primary)" _hover={{ bg: "var(--bg-input)" }}>
                            <Avatar
                                size="sm"
                                cursor="pointer"
                                name={user.name}
                                src={user.pic}
                            />
                        </MenuButton>
                        <MenuList bg="var(--bg-secondary)" borderColor="var(--border-color)">
                            <ProfileModal user={user}>
                                <MenuItem bg="transparent" _hover={{ bg: "var(--bg-input)" }} color="var(--text-primary)">My Profile</MenuItem>
                            </ProfileModal>
                            <SettingsModal>
                                <MenuItem bg="transparent" _hover={{ bg: "var(--bg-input)" }} color="var(--text-primary)">Settings</MenuItem>
                            </SettingsModal>
                            <MenuDivider borderColor="var(--border-color)" />
                            <MenuItem onClick={logoutHandler} bg="transparent" _hover={{ bg: "var(--bg-input)" }} color="var(--text-primary)">Logout</MenuItem>
                        </MenuList>
                    </Menu>
                </div>
            </Box>

            <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerHeader borderBottomWidth="1px">Search Users</DrawerHeader>
                    <DrawerBody>
                        <Box d="flex" pb={2}>
                            <Input
                                placeholder="Search by name or email"
                                mr={2}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Button onClick={handleSearch}>Go</Button>
                        </Box>
                        {loading ? (
                            <ChatLoading />
                        ) : (
                            searchResult?.map((user) => (
                                <UserListItem
                                    key={user._id}
                                    user={user}
                                    handleFunction={() => accessChat(user._id)}
                                />
                            ))
                        )}
                        {loadingChat && <Spinner ml="auto" d="flex" />}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );
};

export default SideDrawer;
