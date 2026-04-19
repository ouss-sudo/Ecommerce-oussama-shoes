import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Contact from "./pages/Contact";
import ProductDetail from "./pages/ProductDetail";
import Stores from "./pages/Stores";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import SpecialOffers from "./pages/SpecialOffers";
import Promotions from "./pages/Promotions";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AnalyticsTracker } from "./components/AnalyticsTracker";
import { ChatAssistant } from "./components/ChatAssistant";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ Désactivé pour forcer l'affichage instantané des changements
      staleTime: 0,
      // ✅ Garde en mémoire 5 minutes
      gcTime: 5 * 60 * 1000,
      // ✅ Re-fetch dès qu'on revient sur l'onglet
      refetchOnWindowFocus: true,
      // ✅ Augmenté à 3 pour être sûr de charger malgré une connexion instable
      retry: 3,
      retryDelay: 1000,
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <BrowserRouter>
                <AnalyticsTracker />
                <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/products/:slug" element={<ProductDetail />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/stores" element={<Stores />} />
                      <Route path="/offres" element={<SpecialOffers />} />
                      <Route path="/promotions" element={<Promotions />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      
                      {/* Protected Routes */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="/profile" element={<Profile />} />
                      </Route>
                    </Routes>
                  </main>
                  <Footer />
                  <ChatAssistant />
                </div>
              </BrowserRouter>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
