import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : window.location.origin);
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const joinGroup = (groupId) => {
    if (socket && groupId) {
      socket.emit('join_group', groupId);
    }
  };

  const leaveGroup = (groupId) => {
    if (socket && groupId) {
      socket.emit('leave_group', groupId);
    }
  };

  const sendGroupMessage = (messageData) => {
    if (socket && messageData) {
      socket.emit('send_message', messageData);
    }
  };

  const emitTyping = (groupId, userName) => {
    if (socket && groupId) {
      socket.emit('typing', { groupId, userName });
    }
  };

  const emitStopTyping = (groupId) => {
    if (socket && groupId) {
      socket.emit('stop_typing', { groupId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        joinGroup,
        leaveGroup,
        sendGroupMessage,
        emitTyping,
        emitStopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
