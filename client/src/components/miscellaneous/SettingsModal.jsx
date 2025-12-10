import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    MenuItem,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    FormControl,
    FormLabel,
    Input,
    Button,
    useToast,
    VStack,
    Box,
    Text,
    Image,
    Avatar
} from "@chakra-ui/react";
import { useState } from "react";
import axios from "axios";
import { ChatState } from "../../context/ChatProvider";

const SettingsModal = ({ children }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { user, setUser } = ChatState();
    const toast = useToast();

    const [name, setName] = useState(user.name);
    const [pic, setPic] = useState(user.pic);
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.put(
                "http://localhost:5000/api/user/profile",
                { name, pic },
                config
            );

            setUser(data);
            localStorage.setItem("userInfo", JSON.stringify(data));
            setLoading(false);
            toast({
                title: "Profile Updated",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            onClose();
        } catch (error) {
            setLoading(false);
            toast({
                title: "Error Updating Profile",
                description: error.response?.data?.message || error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
            setLoading(true);
            const config = {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.post("http://localhost:5000/api/message/upload", formData, config);

            // Backend returns simplified path, we need full URL if it's local
            // Check if it starts with http (Cloudinary) or / (Local)
            const fullPicUrl = data.startsWith("http") ? data : `http://localhost:5000${data}`;

            setPic(fullPicUrl);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            toast({
                title: "Error Uploading Image",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <>
            <span onClick={onOpen}>{children}</span>

            <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
                <ModalOverlay />
                <ModalContent bg="var(--bg-secondary)" color="var(--text-primary)">
                    <ModalHeader fontFamily="Work sans">Settings</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Tabs variant="enclosed" colorScheme="purple">
                            <TabList mb="1em">
                                <Tab _selected={{ color: 'white', bg: 'var(--bg-input)' }}>Account</Tab>
                                <Tab _selected={{ color: 'white', bg: 'var(--bg-input)' }}>General</Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel>
                                    <VStack spacing={4} align="stretch">
                                        <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
                                            <Avatar size="2xl" name={name} src={pic} />
                                            <Button size="sm" onClick={() => document.getElementById("settings-pic-upload").click()}>
                                                Change Picture
                                            </Button>
                                            <input
                                                type="file"
                                                id="settings-pic-upload"
                                                style={{ display: "none" }}
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                        </Box>

                                        <FormControl>
                                            <FormLabel>Name</FormLabel>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                bg="var(--bg-input)"
                                                borderColor="var(--border-color)"
                                            />
                                        </FormControl>

                                        <Button
                                            colorScheme="purple"
                                            onClick={handleUpdate}
                                            isLoading={loading}
                                            width="100%"
                                        >
                                            Save Changes
                                        </Button>
                                    </VStack>
                                </TabPanel>
                                <TabPanel>
                                    <Text>Theme settings and more coming soon...</Text>
                                    <Box mt={4} p={3} bg="var(--bg-input)" borderRadius="md">
                                        <Text fontSize="sm">VITCHAT Version 1.0.0</Text>
                                    </Box>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

export default SettingsModal;
