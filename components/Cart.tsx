import React from 'react';
import { useAppContext } from '@/context/AppContext'
import { CartItem } from '@/types';
import { PlusIcon, MinusIcon, TrashIcon } from './IconComponents';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { cart, updateCartQuantity, cartTotal, placeOrder, clearCart, currency } = useAppContext();

  if (!isOpen) return null;

  const handlePlaceOrder = () => {
    placeOrder();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in" onClick={onClose}>
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-brand-dark">Your Order</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-grow flex flex-col justify-center items-center text-gray-500">
            <p className="text-lg">Your cart is empty.</p>
            <p className="text-sm">Add some delicious items from the menu!</p>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto">
            {cart.map((item: CartItem) => (
              <div key={item.id} className="flex items-center p-4 border-b">
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4" />
                <div className="flex-grow">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">{currency} {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center">
                  <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><MinusIcon className="h-4 w-4" /></button>
                  <span className="px-3 font-bold">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><PlusIcon className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <div className="p-4 border-t space-y-4">
            <div className="flex justify-between items-center font-bold text-xl">
              <span>Total:</span>
              <span>{currency} {cartTotal.toFixed(2)}</span>
            </div>
             <button onClick={clearCart} className="w-full flex justify-center items-center text-sm text-red-600 hover:text-red-800 font-semibold py-2">
                <TrashIcon className="h-4 w-4 mr-2" />
                Clear Cart
            </button>
            <button
              onClick={handlePlaceOrder}
              className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg text-lg hover:bg-indigo-700 transition-colors"
            >
              Send to Waiter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
