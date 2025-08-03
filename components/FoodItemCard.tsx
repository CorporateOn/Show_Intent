import React from 'react';
import { FoodItem } from '@/types';
import { useAppContext } from '@/context/AppContext'
import { PlusIcon } from './IconComponents';

interface FoodItemCardProps {
  item: FoodItem;
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({ item }) => {
  const { addToCart, currency } = useAppContext();
  const { isAvailable } = item;

  return (
    <div className={`relative bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col ${!isAvailable ? 'grayscale opacity-60' : ''}`}>
      {!isAvailable && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10 rounded-lg">
            <span className="text-white text-xl font-bold bg-gray-800 px-4 py-2 rounded-md">Unavailable</span>
        </div>
      )}
      <img className="w-full h-48 object-cover" src={item.image} alt={item.name} />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-brand-dark mb-2">{item.name}</h3>
        <p className="text-gray-600 text-sm mb-4 flex-grow">{item.description}</p>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-lg font-bold text-brand-primary">{currency} {item.price.toFixed(2)}</span>
          <button
            onClick={() => addToCart(item)}
            disabled={!isAvailable}
            className="flex items-center bg-brand-secondary text-white font-bold py-2 px-4 rounded-full hover:bg-amber-500 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodItemCard;
