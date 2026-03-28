import { io } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.121.253:5000';

export const socket = io(SOCKET_URL, {
    autoConnect: true
});
