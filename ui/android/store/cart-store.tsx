import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  restaurantId: string;
}

export interface DeliveryDetails {
  pickup_address: string;
  pickup_business_name: string;
  pickup_phone_number: string;
  dropoff_address: string;
  dropoff_business_name: string;
  dropoff_phone_number: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  total: number;
  restaurantId: string | null;
  deliveryDetails: DeliveryDetails;
  updateDeliveryDetails: (details: Partial<DeliveryDetails>) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    pickup_address: '',
    pickup_business_name: '',
    pickup_phone_number: '',
    dropoff_address: '',
    dropoff_business_name: '',
    dropoff_phone_number: '',
  });

  const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems((prevItems) => {
      // If adding from a different restaurant, clear the cart first (DoorDash style)
      if (prevItems.length > 0 && prevItems[0].restaurantId !== newItem.restaurantId) {
        // In a real app, we'd ask for confirmation. For now, just clear.
        return [{ ...newItem, quantity: 1 }];
      }

      const existingItem = prevItems.find((item) => item.id === newItem.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...newItem, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems((prevItems) =>
      prevItems.reduce((acc, item) => {
        if (item.id === itemId) {
          if (item.quantity > 1) {
            acc.push({ ...item, quantity: item.quantity - 1 });
          }
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as CartItem[])
    );
  };

  const clearCart = () => setItems([]);

  const updateDeliveryDetails = (details: Partial<DeliveryDetails>) => {
    setDeliveryDetails(prev => ({ ...prev, ...details }));
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const restaurantId = items.length > 0 ? items[0].restaurantId : null;

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total, restaurantId, deliveryDetails, updateDeliveryDetails }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
