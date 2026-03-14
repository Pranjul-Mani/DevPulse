import { useEffect, useRef } from "react";
import { connectSocket, disconnectSocket, joinRepo, leaveRepo, getSocket } from "../lib/socket";
import { useRepoStore } from "../store/repoStore";

export const useSocket = (repoId) => {
  const addOnlineUser = useRepoStore((s) => s.addOnlineUser);
  const removeOnlineUser = useRepoStore((s) => s.removeOnlineUser);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    if (repoId) {
      joinRepo(repoId);
    }

    socket.on("presence:join", (data) => {
      addOnlineUser(data);
    });

    socket.on("presence:leave", (data) => {
      removeOnlineUser(data.userId);
    });

    return () => {
      if (repoId) {
        leaveRepo(repoId);
      }
      socket.off("presence:join");
      socket.off("presence:leave");
    };
  }, [repoId, addOnlineUser, removeOnlineUser]);

  return socketRef;
};

export const useSocketEvent = (event, callback) => {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on(event, callback);
    return () => socket.off(event, callback);
  }, [event, callback]);
};
