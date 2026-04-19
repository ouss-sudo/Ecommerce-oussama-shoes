import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowLeft, ArrowRight, Truck, Phone, User as UserIcon, MapPin, CheckCircle2, Loader2, Mail } from "lucide-react";
import { api, getStrapiMedia } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { triggerFireworkBurst } from "../lib/celebration";

export default function Cart() {
    const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const { t, dir, language } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Checkout States
    const [step, setStep] = useState<'cart' | 'delivery' | 'success'>('cart');
    const [loading, setLoading] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    // Form States
    const [formData, setFormData] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: user?.address || "",
    });

    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmitOrder = async () => {
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.address || !formData.email) {
            setError(language === 'ar' ? "يرجى ملء جميع الحقول الإجبارية" : "Veuillez remplir tous les champs obligatoires");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            // Send order to Strapi
            const res = await api.post("/orders/create-from-cart", {
                cartItems: cartItems.map(item => ({
                    id: item.id,
                    documentId: item.documentId,
                    quantity: item.quantity,
                    selectedSize: item.selectedSize,
                    selectedColor: item.selectedColor
                })),
                customerDetails: formData,
                userId: user ? user.documentId || user.id : null,
            });

            if (res.data) {
                setOrderId(res.data.orderId || res.data.documentId);
                setStep('success');
                clearCart();
                triggerFireworkBurst();
            }
        } catch (err: any) {
            console.error("Order error:", err);
            setError(err.response?.data?.error?.message || (language === 'ar' ? "حدث خطأ أثناء معالجة طلبك" : "Une erreur est survenue lors de votre commande"));
        } finally {
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 text-center animate-in fade-in zoom-in duration-500">
                <div className="bg-green-50 p-10 rounded-full">
                    <CheckCircle2 className="h-24 w-24 text-green-500" />
                </div>
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                        {language === 'ar' ? "شكراً لطلبكم!" : "Merci pour votre commande !"}
                    </h1>
                    <p className="text-gray-500 text-sm font-bold max-w-md mx-auto leading-relaxed">
                        {language === 'ar' 
                            ? `تم استلام طلبك بنجاح. رقم الطلب هو: ${orderId}. سنتصل بك قريباً لتأكيد التوصيل.` 
                            : `Votre commande a été reçue avec succès. Numéro de commande : ${orderId}. Nous vous contacterons bientôt pour confirmer la livraison.`
                        }
                    </p>
                </div>
                <button
                    onClick={() => navigate("/products")}
                    className="bg-black text-white px-12 py-5 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"
                >
                    {t.cart.back}
                </button>
            </div>
        );
    }

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

    const shippingCost = cartTotal >= 150 ? 0 : 8;
    const finalTotal = cartTotal + shippingCost;

    return (
        <div className="container px-4 py-12 md:py-24 max-w-[1400px] mx-auto">
            <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <h1 className={`text-4xl md:text-7xl font-black uppercase tracking-tighter ${dir === 'rtl' ? 'text-right' : ''}`}>
                    {step === 'cart' ? t.cart.title : (language === 'ar' ? "معلومات التوصيل" : "Livraison")}
                </h1>
                
                {/* Stepper UI */}
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 ${step === 'cart' ? 'text-black' : 'text-gray-300'}`}>
                        <span className="text-sm font-black">01</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.cart.title}</span>
                    </div>
                    <div className="w-12 h-[2px] bg-gray-100" />
                    <div className={`flex items-center gap-2 ${step === 'delivery' ? 'text-black' : 'text-gray-300'}`}>
                        <span className="text-sm font-black">02</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ar' ? "التوصيل" : "Livraison"}</span>
                    </div>
                </div>
            </div>

            <div className={`grid gap-12 lg:grid-cols-12 ${dir === 'rtl' ? 'rtl text-right' : ''}`}>
                <div className="lg:col-span-8 space-y-8">
                    {step === 'cart' ? (
                        <div className="space-y-6">
                            {cartItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex flex-col sm:flex-row gap-8 bg-white p-8 border border-gray-100 shadow-xl hover:shadow-2xl transition-all ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
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
                                                    onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                                                    className="text-gray-300 hover:text-red-600 transition-colors p-2"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                            <div className={`mt-3 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">{item.brand?.name}</span>
                                                    <span className="text-gray-200">/</span>
                                                    <span className="text-red-600 text-base flex items-baseline gap-1">
                                                        {item.price_display} <span className="text-black text-[10px]">TND</span>
                                                    </span>
                                                </div>

                                                {/* ÉTIQUETTES DE VARIANTES - DESIGN PREMIUM */}
                                                {(item.selectedSize || item.selectedColor) && (
                                                    <div className={`flex gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                                        {item.selectedSize && (
                                                            <div className="bg-black text-white px-3 py-1.5 rounded-none flex items-center gap-2 shadow-lg">
                                                                <span className="opacity-50 text-[8px]">{language === 'ar' ? 'مقاس' : 'SIZE'}</span>
                                                                <span className="text-[11px] leading-none">{item.selectedSize}</span>
                                                            </div>
                                                        )}
                                                        {item.selectedColor && (
                                                            <div className="bg-white text-black border-2 border-black px-3 py-1 rounded-none flex items-center gap-2">
                                                                <span className="opacity-40 text-[8px]">{language === 'ar' ? 'لون' : 'COLOR'}</span>
                                                                <span className="text-[11px] leading-none">{item.selectedColor}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`flex items-center gap-6 mt-8 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`flex items-center border-2 border-black ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                                                    className="p-3 hover:bg-gray-100 disabled:opacity-20 transition-colors"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="w-12 text-center text-sm font-black">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
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
                    ) : (
                        <div className="bg-white p-10 border border-gray-100 shadow-2xl space-y-10 animate-in slide-in-from-right duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <UserIcon className="h-3 w-3" /> {language === 'ar' ? 'الاسم' : 'Prénom'}
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className="w-full border-2 border-gray-100 bg-gray-50 py-4 px-4 text-sm font-bold focus:border-black outline-none transition-all"
                                        placeholder={language === 'ar' ? 'الاسم' : 'Prénom'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <UserIcon className="h-3 w-3" /> {language === 'ar' ? 'اللقب' : 'Nom'}
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className="w-full border-2 border-gray-100 bg-gray-50 py-4 px-4 text-sm font-bold focus:border-black outline-none transition-all"
                                        placeholder={language === 'ar' ? 'اللقب' : 'Nom'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <Mail className="h-3 w-3" /> {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full border-2 border-gray-100 bg-gray-50 py-4 px-4 text-sm font-bold focus:border-black outline-none transition-all"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <Phone className="h-3 w-3" /> {language === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full border-2 border-gray-100 bg-gray-50 py-4 px-4 text-sm font-bold focus:border-black outline-none transition-all"
                                        placeholder={language === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <MapPin className="h-3 w-3" /> {language === 'ar' ? 'عنوان التوصيل' : 'Adresse de livraison'}
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full border-2 border-gray-100 bg-gray-50 py-4 px-4 text-sm font-bold focus:border-black outline-none transition-all resize-none"
                                    placeholder={language === 'ar' ? 'العنوان الكامل (المدينة، النهج، رقم المنزل...)' : 'Adresse complète (Ville, Rue, Numéro...)'}
                                />
                            </div>

                            {error && (
                                <p className="text-red-600 text-[10px] font-black uppercase tracking-widest text-center bg-red-50 p-4 border border-red-100">
                                    {error}
                                </p>
                            )}

                            <button
                                onClick={() => setStep('cart')}
                                className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" /> {language === 'ar' ? 'العودة للمتبضع' : 'Retour au panier'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-white p-10 border border-gray-100 shadow-2xl sticky top-32 space-y-10">
                        <div>
                            <h2 className={`text-2xl font-black uppercase tracking-tighter mb-8 ${dir === 'rtl' ? 'text-right' : ''}`}>{t.cart.summary}</h2>
                            <div className="space-y-6">
                                <div className={`flex justify-between text-[11px] font-black uppercase tracking-[0.2em] ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-gray-400">{t.cart.subtotal}</span>
                                    <span className="text-red-600 font-black flex items-baseline gap-1">
                                        {cartTotal.toFixed(3)} <span className="text-black">TND</span>
                                    </span>
                                </div>
                                <div className={`flex justify-between text-[11px] font-black uppercase tracking-[0.2em] ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-gray-400">{language === 'ar' ? 'التوصيل' : 'Livraison'}</span>
                                    {shippingCost === 0 ? (
                                        <span className="text-green-600 font-black uppercase tracking-widest">{language === 'ar' ? 'مجاني' : 'Gratuit'}</span>
                                    ) : (
                                        <span className="text-red-600 font-black">{shippingCost.toFixed(3)} TND</span>
                                    )}
                                </div>
                                {shippingCost > 0 && (
                                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 p-3 border border-blue-100">
                                        {language === 'ar' 
                                            ? `أضف ${(150 - cartTotal).toFixed(3)} TND لتتمتع بتوصيل مجاني!` 
                                            : `Ajoutez ${(150 - cartTotal).toFixed(3)} TND pour la livraison gratuite !`}
                                    </p>
                                )}
                            </div>
                            <div className="border-t-4 border-black mt-8 pt-8">
                                <div className={`flex justify-between items-baseline ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-xl font-black uppercase tracking-tighter">{t.cart.total}</span>
                                    <span className="text-4xl font-black tracking-tight text-red-600 flex items-baseline gap-1">
                                        {finalTotal.toFixed(3)} <span className="text-black ml-1 text-xl">TND</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {step === 'cart' ? (
                            <button 
                                onClick={() => setStep('delivery')}
                                className={`w-full flex items-center justify-between bg-black text-white px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all active:scale-95 shadow-2xl ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
                            >
                                <span>{t.cart.checkout}</span>
                                <ArrowRight className={`h-5 w-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmitOrder}
                                disabled={loading}
                                className={`w-full flex items-center justify-center bg-red-600 text-white px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-700 transition-all active:scale-95 shadow-2xl disabled:opacity-50`}
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>{language === 'ar' ? 'تأكيد الطلبية' : 'Confirmer ma commande'}</span>
                                        <Truck className={`h-5 w-5 ${dir === 'rtl' ? 'mr-4' : 'ml-4'}`} />
                                    </>
                                )}
                            </button>
                        )}

                        <div className="bg-gray-50 p-6 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                <Truck className="h-4 w-4 text-gray-400" /> {language === 'ar' ? 'توصيل خلال 24/48 ساعة' : 'Livraison sous 24h/48h'}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                <CheckCircle2 className="h-4 w-4 text-gray-400" /> {language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
