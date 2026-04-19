import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Product } from "../types/index";

export interface CartItem extends Product {
    quantity: number;
    selectedImage?: string; 
    selectedSize?: string;
    selectedColor?: string;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Product, quantity?: number, selectedImage?: string, selectedSize?: string, selectedColor?: string) => void;
    removeFromCart: (productId: number, size?: string, color?: string) => void;
    updateQuantity: (productId: number, quantity: number, size?: string, color?: string) => void;
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

    const addToCart = (product: Product, quantity = 1, selectedImage?: string, selectedSize?: string, selectedColor?: string) => {
        setCartItems((prev) => {
            // Check for exactly the same product AND same size/color
            const existing = prev.find((item) => 
                item.id === product.id && 
                item.selectedSize === selectedSize && 
                item.selectedColor === selectedColor
            );

            if (existing) {
                return prev.map((item) =>
                    (item.id === product.id && item.selectedSize === selectedSize && item.selectedColor === selectedColor)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { ...product, quantity, selectedImage, selectedSize, selectedColor }];
        });
    };

    const removeFromCart = (productId: number, size?: string, color?: string) => {
        setCartItems((prev) => prev.filter((item) => 
            !(item.id === productId && item.selectedSize === size && item.selectedColor === color)
        ));
    };

    const updateQuantity = (productId: number, quantity: number, size?: string, color?: string) => {
        if (quantity < 1) return;
        setCartItems((prev) =>
            prev.map((item) =>
                (item.id === productId && item.selectedSize === size && item.selectedColor === color) 
                    ? { ...item, quantity } 
                    : item
            )
        );
    };

    const clearCart = () => setCartItems([]);

    const cartTotal = cartItems.reduce((total, item) => {
        // Parse price removing currency symbols just in case, assuming format like "120 TND" or similar
        // If price_display is just a string without numeric value easily parseable, this might be tricky.
        // Let's try to extract numbers.
        const priceString = item.price_display || "0";
        // Repleace comma with dot for Tunisian/European decimal notation, then remove non-digits/dots.
        const price = parseFloat(priceString.replace(/,/g, ".").replace(/[^0-9.]/g, "")) || 0;
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
