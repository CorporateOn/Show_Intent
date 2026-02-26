import { NextApiRequest, NextApiResponse } from 'next';
import { Server, Socket } from 'socket.io';
import { Order } from '@/types';

type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: any;
  };
};

// This should be replaced with a database solution for production
const orders: Order[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });
    res.socket.server.io = io;

    io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);
      socket.emit('initial_orders', orders);

      socket.on('place_order', (order: Order) => {
        orders.push(order);
        io.emit('new_order_received', orders);
      });

      socket.on('complete_order', (orderId: string) => {
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
          orders.splice(index, 1);
          io.emit('new_order_received', orders);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  res.end();
}