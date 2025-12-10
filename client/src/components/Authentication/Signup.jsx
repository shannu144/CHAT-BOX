import { Button } from "@chakra-ui/react";
import { FormControl, FormLabel } from "@chakra-ui/react";
import { Input, InputGroup, InputRightElement } from "@chakra-ui/react";
import { VStack } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
    const [show, setShow] = useState(false);
    const handleClick = () => setShow(!show);
    const toast = useToast();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [confirmpassword, setConfirmpassword] = useState("");
    const [password, setPassword] = useState("");
    const [pic, setPic] = useState();
    const [picLoading, setPicLoading] = useState(false);

    const submitHandler = async () => {
        setPicLoading(true);
        if (!name || !email || !password || !confirmpassword) {
            toast({
                title: "Please Fill all the Feilds",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            setPicLoading(false);
            return;
        }
        if (password !== confirmpassword) {
            toast({
                title: "Passwords Do Not Match",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            return;
        }
        try {
            const config = {
                headers: {
                    "Content-type": "application/json",
                },
            };

            // Using default pic if undefined
            const payload = {
                name,
                email,
                password,
                pic: pic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
            };

            const { data } = await axios.post(
                "http://localhost:5000/api/user",
                payload,
                config
            );

            toast({
                title: "Registration Successful",
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            localStorage.setItem("userInfo", JSON.stringify(data));
            setPicLoading(false);
            navigate("/chats");
        } catch (error) {
            toast({
                title: "Error Occured!",
                description: error.response?.data?.message || "Something went wrong",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            setPicLoading(false);
        }
    };

    return (
        <VStack spacing="5px">
            <FormControl id="first-name" isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                    placeholder="Enter Your Name"
                    onChange={(e) => setName(e.target.value)}
                    bg="var(--bg-input)"
                    color="var(--text-primary)"
                    _placeholder={{ color: 'var(--text-placeholder)' }}
                    borderColor="var(--border-color)"
                    _hover={{ borderColor: 'var(--text-secondary)' }}
                />
            </FormControl>
            <FormControl id="email" isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input
                    type="email"
                    placeholder="Enter Your Email Address"
                    onChange={(e) => setEmail(e.target.value)}
                    bg="var(--bg-input)"
                    color="var(--text-primary)"
                    _placeholder={{ color: 'var(--text-placeholder)' }}
                    borderColor="var(--border-color)"
                    _hover={{ borderColor: 'var(--text-secondary)' }}
                />
            </FormControl>
            <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup size="md">
                    <Input
                        type={show ? "text" : "password"}
                        placeholder="Enter Password"
                        onChange={(e) => setPassword(e.target.value)}
                        bg="var(--bg-input)"
                        color="var(--text-primary)"
                        _placeholder={{ color: 'var(--text-placeholder)' }}
                        borderColor="var(--border-color)"
                        _hover={{ borderColor: 'var(--text-secondary)' }}
                    />
                    <InputRightElement width="4.5rem">
                        <Button h="1.75rem" size="sm" onClick={handleClick} bg="var(--bg-secondary)" color="var(--text-primary)">
                            {show ? "Hide" : "Show"}
                        </Button>
                    </InputRightElement>
                </InputGroup>
            </FormControl>
            <FormControl id="password-confirm" isRequired>
                <FormLabel>Confirm Password</FormLabel>
                <InputGroup size="md">
                    <Input
                        type={show ? "text" : "password"}
                        placeholder="Confirm Password"
                        onChange={(e) => setConfirmpassword(e.target.value)}
                        bg="var(--bg-input)"
                        color="var(--text-primary)"
                        _placeholder={{ color: 'var(--text-placeholder)' }}
                        borderColor="var(--border-color)"
                        _hover={{ borderColor: 'var(--text-secondary)' }}
                    />
                    <InputRightElement width="4.5rem">
                        <Button h="1.75rem" size="sm" onClick={handleClick}>
                            {show ? "Hide" : "Show"}
                        </Button>
                    </InputRightElement>
                </InputGroup>
            </FormControl>

            <Button
                colorScheme="blue"
                width="100%"
                style={{ marginTop: 15 }}
                onClick={submitHandler}
                isLoading={picLoading}
            >
                Sign Up
            </Button>
        </VStack>
    );
};

export default Signup;
