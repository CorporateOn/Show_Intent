// This is the central definition for all data types in the application.

// A single category name, e.g., "Appetizers"
export type Category = string;

// The structure for a single food item on the menu
export interface FoodItem {
  id: string;        // Can be a database ID or a temporary one
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  isAvailable: boolean;
}

// Extends FoodItem with a quantity for use in the shopping cart
export interface CartItem extends FoodItem {
  quantity: number;
}

// The structure for a customer's order
export interface Order {
  id: string;
  items: CartItem[];
  totalPrice: number;
  timestamp: Date;
  table: string;
  isComplete?: boolean; // Optional property
}

export interface SavableState {
  restaurantName: string;
  currency: string;
  adminPassword: string;
  waiterPassword: string;
  categories: Category[];
  menuItems: FoodItem[];
  backgroundImage: string;
  headerBgColor: string;
  headerTextColor: string;
  logoUrl: string; 
  logoType: 'text' | 'logo'; 
  textColor: string;
}