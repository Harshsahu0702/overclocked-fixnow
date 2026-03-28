import { io } from 'socket.io-client';

const SOCKET_URL = 'http://10.74.227.253:5000';

export const socket = io(SOCKET_URL, {
    autoConnect: true
});
