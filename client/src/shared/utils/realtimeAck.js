/** Sends a realtime request and waits until the server confirms it. */
export function requestRealtimeAck(socket, eventName, acknowledgementEvent, payload) {
  if (!socket?.connected) return Promise.reject(new Error('Realtime connection is not ready.'));

  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => finish(new Error('Realtime request timed out.')), 5000);
    const handleAcknowledgement = (response) => {
      if (response?.requestId !== requestId) return;
      finish(response.ok === false ? new Error(response.message || 'Realtime request failed.') : null);
    };
    const finish = (error) => {
      window.clearTimeout(timeout);
      socket.off(acknowledgementEvent, handleAcknowledgement);
      if (error) reject(error);
      else resolve();
    };

    socket.on(acknowledgementEvent, handleAcknowledgement);
    socket.emit(eventName, { ...payload, requestId });
  });
}
