import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowLeft, ArrowRight } from "lucide-react";
import { getStrapiMedia } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";

export default function Cart() {
    const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
    const { t, dir } = useLanguage();

    if (cartItems.length === 0) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4 text-center">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">{t.cart.empty}</h1>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{t.cart.noItems}</p>
                </div>
                <Link
                    to="/products"
                    className={`inline-flex items-center bg-black text-white px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all active:scale-95 shadow-2xl ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
                >
                    <ArrowLeft className={`h-4 w-4 ${dir === 'rtl' ? 'ml-3' : 'mr-3'}`} />
                    {t.cart.back}
                </Link>
            </div>
        );
    }

    return (
        <div className="container px-4 py-12 md:py-24 max-w-[1400px] mx-auto">
            <h1 className={`mb-16 text-4xl md:text-6xl font-black uppercase tracking-tighter ${dir === 'rtl' ? 'text-right' : ''}`}>{t.cart.title}</h1>

            <div className={`grid gap-12 lg:grid-cols-3 ${dir === 'rtl' ? 'rtl' : ''}`}>
                <div className="lg:col-span-2 space-y-6">
                    {cartItems.map((item) => (
                        <div
                            key={item.id}
                            className={`flex flex-col sm:flex-row gap-8 bg-white p-8 border border-gray-100 shadow-xl hover:shadow-2xl transition-all ${dir === 'rtl' ? 'text-right' : ''}`}
                        >
                            <div className="h-40 w-40 flex-shrink-0 overflow-hidden bg-gray-50 border border-gray-100">
                                {item.selectedImage || item.cover?.url ? (
                                    <img
                                        src={getStrapiMedia(item.selectedImage || item.cover?.url || null) || ""}
                                        alt={item.name}
                                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                                        {t.productDetail.noImage}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-1 flex-col justify-between">
                                <div>
                                    <div className={`flex justify-between items-start ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                        <h3 className="font-black text-2xl uppercase tracking-tighter">{item.name}</h3>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-gray-300 hover:text-red-600 transition-colors p-2"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className={`mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                        <span>{item.brand?.name}</span>
                                        <span>/</span>
                                        <span className="text-black">{item.price_display}</span>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-6 mt-8 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex items-center border-2 border-black ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="p-3 hover:bg-gray-100 disabled:opacity-20 transition-colors"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-12 text-center text-sm font-black">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="p-3 hover:bg-gray-100 transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-10 border border-gray-100 shadow-2xl sticky top-32">
                        <h2 className={`text-2xl font-black uppercase tracking-tighter mb-8 ${dir === 'rtl' ? 'text-right' : ''}`}>{t.cart.summary}</h2>
                        <div className="space-y-6 mb-8">
                            <div className={`flex justify-between text-[11px] font-black uppercase tracking-[0.2em] ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                <span className="text-gray-400">{t.cart.subtotal}</span>
                                <span>{cartTotal.toFixed(2)} TND</span>
                            </div>
                            <div className={`flex justify-between text-[11px] font-black uppercase tracking-[0.2em] ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                <span className="text-gray-400">{t.cart.shipping}</span>
                                <span className="text-red-600">{t.cart.free}</span>
                            </div>
                        </div>
                        <div className="border-t-4 border-black pt-6 mb-10">
                            <div className={`flex justify-between items-baseline ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                <span className="text-xl font-black uppercase tracking-tighter">{t.cart.total}</span>
                                <span className="text-3xl font-black tracking-tight">{cartTotal.toFixed(2)} TND</span>
                            </div>
                        </div>
                        <button className={`w-full flex items-center justify-between bg-black text-white px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all active:scale-95 shadow-2xl ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                            <span>{t.cart.checkout}</span>
                            <ArrowRight className={`h-5 w-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                        </button>
                        <p className="text-[9px] font-black text-gray-400 text-center mt-6 uppercase tracking-widest leading-relaxed">
                            {t.cart.taxes}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
