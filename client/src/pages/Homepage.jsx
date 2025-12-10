import {
    Box,
    Container,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";

const Homepage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("userInfo"));

        if (user) navigate("/chats");
    }, [navigate]);

    return (
        <Container maxW="xl" centerContent>
            <Box
                d="flex"
                justifyContent="center"
                p={3}
                bg="var(--bg-secondary)"
                w="100%"
                m="40px 0 15px 0"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="var(--border-color)"
            >
                <Text
                    fontSize="4xl"
                    fontFamily="Work sans"
                    textAlign="center"
                    bgGradient="linear(to-l, #7928CA, #FF0080)"
                    bgClip="text"
                    fontWeight="extrabold"
                >
                    VITCHAT
                </Text>
            </Box>
            <Box bg="var(--bg-secondary)" w="100%" p={4} borderRadius="lg" borderWidth="1px" borderColor="var(--border-color)">
                <Tabs isFitted variant="soft-rounded">
                    <TabList mb="1em">
                        <Tab _selected={{ color: 'white', bg: 'var(--bg-input)' }} color="var(--text-secondary)">Login</Tab>
                        <Tab _selected={{ color: 'white', bg: 'var(--bg-input)' }} color="var(--text-secondary)">Sign Up</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <Login />
                        </TabPanel>
                        <TabPanel>
                            <Signup />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </Container>
    );
};

export default Homepage;
