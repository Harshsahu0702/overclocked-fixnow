import { io } from "socket.io-client";
import { API_BASE } from "./config";
const SOCKET_URL = API_BASE;

export const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: true
});
