import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: string;
  priceNumber: number;
  image?: string;
  color?: string;
  colorId?: number;
  quantity?: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: number; colorId?: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; colorId?: number; quantity: number } }
  | { type: 'CLEAR_CART' };

const computeTotals = (items: CartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const totalPrice = items.reduce((sum, item) => sum + (item.priceNumber * (item.quantity || 1)), 0)
  return { totalItems, totalPrice }
}

const loadInitial = (): CartState => {
  try {
    const s = localStorage.getItem('cart_items')
    if (s) {
      const items = JSON.parse(s) as CartItem[]
      const { totalItems, totalPrice } = computeTotals(items)
      return { items, totalItems, totalPrice }
    }
  } catch {}
  return { items: [], totalItems: 0, totalPrice: 0 }
}

const initialState: CartState = loadInitial();

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id && item.colorId === action.payload.colorId);
      let updatedItems;
      
      if (existingItem) {
        updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      } else {
        updatedItems = [...state.items, { ...action.payload, quantity: 1 }];
      }
      
      localStorage.setItem('cart_items', JSON.stringify(updatedItems))
      const { totalItems, totalPrice } = computeTotals(updatedItems)
      
      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice,
      };
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => !(item.id === action.payload.id && item.colorId === action.payload.colorId));
      localStorage.setItem('cart_items', JSON.stringify(updatedItems))
      const { totalItems, totalPrice } = computeTotals(updatedItems)
      
      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice,
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id && item.colorId === action.payload.colorId
          ? { ...item, quantity: Math.max(1, action.payload.quantity) }
          : item
      );
      
      localStorage.setItem('cart_items', JSON.stringify(updatedItems))
      const { totalItems, totalPrice } = computeTotals(updatedItems)
      
      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice,
      };
    }
    
    case 'CLEAR_CART':
      localStorage.removeItem('cart_items')
      return { items: [], totalItems: 0, totalPrice: 0 };
      
    default:
      return state;
  }
};

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: number, colorId?: number) => void;
  updateQuantity: (id: number, colorId: number | undefined, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  const addItem = (item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };
  
  const removeItem = (id: number, colorId?: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id, colorId } });
  };
  
  const updateQuantity = (id: number, colorId: number | undefined, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, colorId, quantity } });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const getTotalPrice = () => {
    return state.totalPrice;
  };
  
  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems: state.totalItems,
        totalPrice: state.totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
