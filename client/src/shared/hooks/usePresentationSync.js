import { useMemo } from 'react';
import useRealtimeSocket from './useRealtimeSocket';

export default function usePresentationSync({ room, onEvent, enabled = true }) {
  const socketPath = useMemo(() => '/ws/realtime', []);

  return useRealtimeSocket({
    path: socketPath,
    enabled,
    onMessage: (msg) => {
      if (msg && msg.room && msg.room !== room) return;
      if (typeof onEvent === 'function') onEvent(msg);
    }
  });
}
