import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useRealtimeExams(callback: (payload: any) => void) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // connect to the unified Socket on the NestJS backend
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      console.log('[useRealtimeExams] Connected to realtime schedule updates');
    });

    socket.on('schedule_updated', (payload) => {
      console.log('[useRealtimeExams] Schedule updated, refreshing...', payload);
      // Brief delay so DB transactions commit before fetch
      setTimeout(() => {
        if (savedCallback.current) {
          savedCallback.current(payload);
        }
      }, 500);
    });

    return () => {
      console.log('[useRealtimeExams] Disconnecting...');
      socket.disconnect();
    };
  }, []);
}
