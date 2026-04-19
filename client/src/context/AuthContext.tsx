import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "../lib/api";

interface User {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    gender?: string;
    birthDate?: string;
    confirmed: boolean;
    blocked: boolean;
    createdAt: string;
    updatedAt: string;
    avatar?: { url: string };
    loyaltyPoints?: number;
    loyaltyLevel?: "BRONZE" | "SILVER" | "GOLD";
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const validateToken = async () => {
            const storedToken = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");

            if (storedToken && storedUser) {
                try {
                    // Force the token for this initial validation call
                    const res = await api.get<User>("/users/me?populate=avatar", {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });
                    setToken(storedToken);
                    setUser(res.data);
                } catch (err) {
                    console.error("Session expired or invalid token", err);
                    logout();
                }
            }
            setIsLoading(false);
        };

        validateToken();
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);

        // Update axios default header if needed, but since we use a custom instance in lib/api, 
        // we might need to intercept or just manually pass headers.
        // For simplicity, we assume api requests requiring auth will manually attach headers or we update a global state
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
