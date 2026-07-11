import { useEffect, useRef } from 'react';
import { createRealtimeSocket } from '../../lib/socket';

export default function useRealtimeSocket({ path = '/ws/realtime', onMessage, enabled = true }) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const socket = createRealtimeSocket(path, onMessage);
    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [path, onMessage, enabled]);

  return socketRef;
}
