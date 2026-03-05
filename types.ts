export type Category = string;

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  takeawayPrice: number;
  category: Category;
  image: string;
  isAvailable: boolean;
}

export interface CartItem extends FoodItem {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  totalPrice: number;        
  timestamp: string;    
  table: string;              
  status: 'pending' | 'completed';
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
  aboutDescription: string;
  aboutLocation: string;
  aboutPhone: string;
  aboutEmail: string;
  aboutOwnerName: string;
  aboutOwnerTitle: string;
  aboutOwnerQuote: string;
  aboutOwnerStory: string;
  aboutOwnerImage: string;
  aboutMotivationQuotes: string[];
  aboutMapEmbed: string;
}