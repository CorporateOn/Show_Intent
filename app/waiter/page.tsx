'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext'
import { Order } from '@/types';

const OrderCard: React.FC<{ order: Order; onComplete: (id: string) => void, currency: string }> = ({ order, onComplete, currency }) => {
    const [isCompleting, setIsCompleting] = useState(false);

    const handleComplete = () => {
        setIsCompleting(true);
        setTimeout(() => {
            onComplete(order.id);
        }, 500); // match animation duration
    };

    return (
        <div className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-500 ${isCompleting ? 'animate-swipe-out' : 'animate-fade-in'}`}>
            <div className="p-5 border-b-2 border-dashed">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-brand-dark">{order.table}</h3>
                    <span className="text-sm text-gray-500">{new Date(order.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-gray-400">Order ID: {order.id}</p>
            </div>
            <div className="p-5">
                <ul className="space-y-2 mb-4">
                    {order.items.map(item => (
                        <li key={item.id} className="flex justify-between text-gray-700">
                            <span>{item.quantity} x {item.name}</span>
                            <span>{currency} {(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                <div className="border-t pt-3 mt-3 flex justify-between items-center font-bold text-lg text-brand-dark">
                    <span>Total</span>
                    <span>{currency} {order.totalPrice.toFixed(2)}</span>
                </div>
            </div>
            <button
                onClick={handleComplete}
                className="w-full bg-green-500 text-white font-bold py-3 hover:bg-green-600 transition-colors"
            >
                Mark as Completed
            </button>
        </div>
    );
};

const WaiterDashboard: React.FC = () => {
  const { orders, completeOrder, currency, authStatus } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (authStatus.isAuthenticated === null) {
       // Still initializing, wait for auth status to be determined
       return;
    }
    const isAuthorized = authStatus.role === 'waiter' || authStatus.role === 'admin';
    if (!isAuthorized) {
      router.push('/login');
    }
  }, [authStatus, router]);
  
  const isAuthorized = authStatus.isAuthenticated === true && (authStatus.role === 'waiter' || authStatus.role === 'admin');

  if (!isAuthorized) {
    // Render a loading state or null while redirecting
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Loading or redirecting...</p>
        </div>
    );
  }

  return (
    <div className="bg-slate-200 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-brand-dark mb-6 text-center">Incoming Orders</h1>
        {orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order: Order) => (
              <OrderCard key={order.id} order={order} onComplete={completeOrder} currency={currency} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-600">No active orders</h2>
            <p className="text-gray-400 mt-2">New orders will appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterDashboard;
