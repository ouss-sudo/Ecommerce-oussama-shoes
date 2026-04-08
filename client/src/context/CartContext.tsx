import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Product } from "../types/index";

export interface CartItem extends Product {
    quantity: number;
    selectedImage?: string; // To show the specific image
    // size?: string; // Future improvement
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Product, quantity?: number, selectedImage?: string) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("cart");
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product: Product, quantity = 1, selectedImage?: string) => {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { ...product, quantity, selectedImage }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCartItems((prev) => prev.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity < 1) return;
        setCartItems((prev) =>
            prev.map((item) =>
                (item.id === productId ? { ...item, quantity } : item)
            )
        );
    };

    const clearCart = () => setCartItems([]);

    const cartTotal = cartItems.reduce((total, item) => {
        // Parse price removing currency symbols just in case, assuming format like "120 TND" or similar
        // If price_display is just a string without numeric value easily parseable, this might be tricky.
        // Let's try to extract numbers.
        const priceString = item.price_display || "0";
        const price = parseFloat(priceString.replace(/[^0-9.]/g, "")) || 0;
        return total + price * item.quantity;
    }, 0);

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartTotal,
                cartCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
