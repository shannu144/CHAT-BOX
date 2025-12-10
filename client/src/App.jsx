import { Route, Routes } from 'react-router-dom';
import Homepage from './pages/Homepage';
import ChatPage from './pages/ChatPage';
import './App.css';
import { useEffect } from 'react';
import io from 'socket.io-client';
import { ChatState } from './context/ChatProvider';

const ENDPOINT = "http://localhost:5000";
let socket;

function App() {
  const { user, setOnlineUsers } = ChatState();

  useEffect(() => {
    if (user) {
      socket = io(ENDPOINT);
      socket.emit("setup", user);

      socket.on("online users", (users) => {
        setOnlineUsers(users);
      });
    }
  }, [user, setOnlineUsers]);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/chats" element={<ChatPage />} />
      </Routes>
    </div>
  );
}

export default App;
