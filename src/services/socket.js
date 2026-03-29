import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(window.location.origin, {
            path: '/ws',
            transports: ['websocket', 'polling'],
        });
    }
    return socket;
};

export const joinOrder = (orderId) => {
    const s = getSocket();
    s.emit('join:order', orderId);
};

export const onOrderStatus = (callback) => {
    const s = getSocket();
    s.on('order:status', callback);
    return () => s.off('order:status', callback);
};