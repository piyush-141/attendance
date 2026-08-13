import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(sessionId: string | null, onNew: (record: { rollNo: string; name: string; submittedAt: string }) => void, onEnded: () => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const socket = io(apiUrl, {
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:session', sessionId);
    });

    socket.on('attendance:new', onNew);
    socket.on('session:ended', onEnded);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
}
