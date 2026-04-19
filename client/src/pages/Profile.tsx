import { useState, useRef, type SyntheticEvent, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api, STRAPI_URL, getStrapiMedia } from "../lib/api";
import { Loader2, User as UserIcon, Mail, Phone, Camera, CalendarDays, Sparkles, MapPin, Building2, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import { LoyaltyCard } from "../components/LoyaltyCard";

export default function Profile() {
    const { user, token, login } = useAuth();
    const { t, dir, language } = useLanguage();
    const navigate = useNavigate();

    const [username, setUsername] = useState(user?.username || "");
    const [firstName, setFirstName] = useState(user?.firstName || "");
    const [lastName, setLastName] = useState(user?.lastName || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [address, setAddress] = useState(user?.address || "");
    const [city, setCity] = useState(user?.city || "");
    const [postalCode, setPostalCode] = useState(user?.postalCode || "");
    const [avatarUrl, setAvatarUrl] = useState("");
    
    // UI states
    const [activeTab, setActiveTab] = useState<'info' | 'loyalty' | 'history'>('history');

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    useEffect(() => {
        if (!user && !token) {
            navigate("/login");
            return;
        }

        if (user && token) {
            const freshToken = localStorage.getItem("token") || token;
            api.get(`/users/me?populate=avatar`, {
                headers: { Authorization: `Bearer ${freshToken}` }
            }).then((res) => {
                const freshUser = res.data;
                if (freshToken) login(freshToken, freshUser);

                setUsername(freshUser.username || "");
                setFirstName(freshUser.firstName || "");
                setLastName(freshUser.lastName || "");
                setEmail(freshUser.email || "");
                setPhone(freshUser.phone || "");
                setAddress(freshUser.address || "");
                setCity(freshUser.city || "");
                setPostalCode(freshUser.postalCode || "");

                if (freshUser.avatar?.url) {
                    setAvatarUrl(getStrapiMedia(freshUser.avatar.url) || "");
                }
            }).catch(console.error);
        }
    }, [user?.id, token, navigate]);

    useEffect(() => {
        if (activeTab === 'history' && token) {
            setLoadingOrders(true);
            const freshToken = localStorage.getItem("token") || token;
            api.get(`/orders?sort=createdAt:desc&populate[items][populate][product][populate][0]=cover&populate[items][populate][product][populate][1]=gallery`, {
                headers: { Authorization: `Bearer ${freshToken}` }
            }).then((res) => {
                console.log("FETCHED ORDERS:", JSON.stringify(res.data.data, null, 2));
                setOrders(res.data.data || []);
            }).catch(console.error).finally(() => setLoadingOrders(false));
        }
    }, [activeTab, token]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);
        setError(null);
        setSuccess(null);

        const freshToken = localStorage.getItem("token") || token;
        const formData = new FormData();
        formData.append("files", file);

        try {
            const uploadRes = await axios.post(`${STRAPI_URL}/api/upload`, formData, {
                headers: { Authorization: `Bearer ${freshToken}` }
            });

            const avatarId = uploadRes.data[0].id;
            const updateRes = await api.put(`/users/${user?.id}`, {
                avatar: avatarId
            }, {
                headers: { Authorization: `Bearer ${freshToken}` }
            });

            login(freshToken!, { ...updateRes.data, avatar: uploadRes.data[0] });
            const newUrl = uploadRes.data[0].url;
            setAvatarUrl(getStrapiMedia(newUrl) || "");
            setSuccess(t.profile.avatarSuccess);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error?.message || "Erreur upload");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (e: SyntheticEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        const freshToken = localStorage.getItem("token") || token;

        try {
            // Build payload with only changed fields or non-sensitive fields to avoid Strapi 403
            const payload: any = {
                firstName,
                lastName,
                phone,
                address,
                city,
                postalCode,
            };

            // Only include username/email if they actually changed to avoid security blocks
            if (username !== user?.username) payload.username = username;
            if (email !== user?.email) payload.email = email;

            const response = await api.put(`/users/${user?.id}`, payload, {
                headers: { Authorization: `Bearer ${freshToken}` }
            });

            login(freshToken!, { ...response.data, avatar: user?.avatar });
            setSuccess(t.profile.success || "Profil mis à jour avec succès !");
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error?.message || "Erreur de mise à jour");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="container max-w-4xl px-4 py-12 md:py-24 mx-auto">
            <h1 className={`text-4xl font-black uppercase tracking-tight mb-12 ${dir === "rtl" ? "text-right" : ""}`}>
                {t.profile.title || "Mon Profil"}
            </h1>

            {/* Tabs Navigation */}
            <div className={`flex gap-4 mb-8 border-b-2 border-gray-100 flex-wrap ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <button 
                    type="button"
                    onClick={() => setActiveTab('loyalty')}
                    className={`text-sm font-black uppercase tracking-widest px-4 py-4 transition-all -mb-[2px] ${activeTab === 'loyalty' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'}`}>
                    {t.profile.loyaltyCard || "Carte de Fidélité"}
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab('info')}
                    className={`text-sm font-black uppercase tracking-widest px-4 py-4 transition-all -mb-[2px] ${activeTab === 'info' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'}`}>
                    {t.profile.personalInfo || "Infos Personnelles"}
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`text-sm font-black uppercase tracking-widest px-4 py-4 transition-all -mb-[2px] ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'}`}>
                    {language === 'ar' ? 'تاريخ المشتريات' : "Historique d'Achats"}
                </button>
            </div>

            <div className="bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-100 p-8 md:p-12 relative overflow-hidden rounded-3xl min-h-[500px]">
                
                {/* ── Section Carte de Fidélité ── */}
                {activeTab === 'loyalty' && (
                    <div className="relative z-10 w-full animate-in fade-in duration-500">
                        <div className="mb-12 text-center max-w-xl mx-auto">
                            <h2 className="text-3xl font-black uppercase tracking-tight mb-4 text-indigo-900">
                                {language === 'ar' ? 'كيف يعمل؟' : 'Comment ça marche ?'}
                            </h2>
                            <p className="text-gray-500 leading-relaxed font-medium">
                                {language === 'ar' 
                                    ? 'حوّل مشترياتك إلى مكافآت! كل دينار تنفقه يمنحك نقاطاً. اجمع 500 نقطة لفتح قسيمة شراء حصرية بقيمة 10 د.ت.'
                                    : (language === 'en' 
                                        ? 'Turn your purchases into rewards! Every dinar spent earns you points. Collect 500 points to unlock an exclusive 10 DT voucher.'
                                        : 'Transformez vos achats en récompenses ! Chaque dinar dépensé vous rapporte des points. Cumulez 500 points pour débloquer un bon d\'achat exclusif de 10 DT.')}
                            </p>
                            
                            <div className="grid grid-cols-3 gap-4 mt-8">
                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center">
                                    <span className="text-2xl font-black text-indigo-600 mb-1">1</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">TND Dépensé</span>
                                </div>
                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center">
                                    <span className="text-2xl font-black text-indigo-600 mb-1">=</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Équivaut à</span>
                                </div>
                                <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 flex flex-col items-center">
                                    <span className="text-2xl font-black text-purple-600 mb-1">1</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Point Gagné</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <LoyaltyCard 
                                points={user?.loyaltyPoints || 0}
                                level={user?.loyaltyLevel || "BRONZE"}
                                userName={`${firstName} ${lastName}`.trim() || username}
                                memberSince={new Date(user.createdAt).toLocaleDateString()}
                            />
                        </div>
                    </div>
                )}

                {/* ── Section Infos Personnelles ── */}
                {activeTab === 'info' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="absolute top-0 right-0 -mt-16 -mr-16 text-indigo-50 opacity-60 pointer-events-none">
                    <Sparkles className="w-64 h-64" />
                </div>

                {/* Avatar + name */}
                <div className={`flex flex-col md:flex-row items-center md:items-start md:space-x-8 mb-12 relative z-10 ${dir === "rtl" ? "md:flex-row-reverse md:space-x-reverse" : ""}`}>
                    <div
                        className={`relative h-28 w-28 rounded-full shadow-lg border-4 border-white flex flex-shrink-0 items-center justify-center text-white text-4xl font-black cursor-pointer group mb-6 md:mb-0 transition-transform hover:scale-105 ${uploading ? "animate-pulse bg-gray-300" : "bg-gradient-to-tr from-indigo-900 to-purple-800"}`}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                        {avatarUrl && !uploading ? (
                            <img src={avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
                        ) : !uploading && (
                            <span>{username.charAt(0).toUpperCase()}</span>
                        )}
                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                            {uploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
                        </div>
                    </div>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" />

                    <div className={`text-center md:text-left ${dir === "rtl" ? "md:text-right" : ""} flex-1`}>
                        <h2 className="text-3xl font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500">
                            {firstName} {lastName}
                        </h2>
                        <div className={`inline-flex items-center space-x-2 bg-gradient-to-l from-indigo-50 to-purple-50 border border-indigo-100/50 text-indigo-700 px-5 py-2.5 mt-4 rounded-full shadow-sm font-semibold text-xs tracking-wider uppercase ${dir === "rtl" ? "space-x-reverse" : ""}`}>
                            <CalendarDays className="w-[18px] h-[18px] text-indigo-600" />
                            <span>{t.profile.memberSince} {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-8 relative z-10">

                    {/* ── Section Infos personnelles ── */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">{t.profile.personalInfo}</p>
                        <div className="space-y-4">
                            {/* First & Last Name */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={`block text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 ${dir === "rtl" ? "text-right" : ""}`}>Prénom</label>
                                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                                        className={`block w-full border-2 border-gray-100 bg-gray-50/50 py-4 ${dir === "rtl" ? "text-right" : ""} px-4 text-sm font-bold focus:border-indigo-500 focus:bg-white focus:outline-none transition-all rounded-2xl`} />
                                </div>
                                <div className="space-y-2">
                                    <label className={`block text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 ${dir === "rtl" ? "text-right" : ""}`}>Nom</label>
                                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                                        className={`block w-full border-2 border-gray-100 bg-gray-50/50 py-4 ${dir === "rtl" ? "text-right" : ""} px-4 text-sm font-bold focus:border-indigo-500 focus:bg-white focus:outline-none transition-all rounded-2xl`} />
                                </div>
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                                <label className={`block text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 ${dir === "rtl" ? "text-right" : ""}`}>{t.auth.username || "Nom Utilisateur"}</label>
                                <div className="relative">
                                    <span className={`absolute inset-y-0 ${dir === "rtl" ? "right-0 pr-4" : "left-0 pl-4"} flex items-center`}>
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                    </span>
                                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                                        className={`block w-full border-2 border-gray-100 bg-gray-50/50 py-4 ${dir === "rtl" ? "pr-12 pl-4 text-right" : "pl-12 pr-4"} text-sm font-bold focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all rounded-2xl`} />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className={`block text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 ${dir === "rtl" ? "text-right" : ""}`}>{t.auth.email || "Email"}</label>
                                <div className="relative">
                                    <span className={`absolute inset-y-0 ${dir === "rtl" ? "right-0 pr-4" : "left-0 pl-4"} flex items-center`}>
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </span>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                        className={`block w-full border-2 border-gray-100 bg-gray-50/50 py-4 ${dir === "rtl" ? "pr-12 pl-4 text-right" : "pl-12 pr-4"} text-sm font-bold focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all rounded-2xl`} />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className={`block text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 ${dir === "rtl" ? "text-right" : ""} flex items-center justify-between`}>
                                    <span>{t.profile.phone}</span>
                                    <span className="text-[10px] text-gray-400 lowercase font-medium tracking-normal">({t.profile.optional})</span>
                                </label>
                                <div className="relative">
                                    <span className={`absolute inset-y-0 ${dir === "rtl" ? "right-0 pr-4" : "left-0 pl-4"} flex items-center`}>
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </span>
                                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+216 55 555 555"
                                        className={`block w-full border-2 border-gray-100 bg-gray-50/50 py-4 ${dir === "rtl" ? "pr-12 pl-4 text-right" : "pl-12 pr-4"} text-sm font-bold focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all rounded-2xl placeholder:opacity-40`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Section Adresse de livraison ── */}
                    <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border border-indigo-100 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <MapPin className="w-5 h-5 text-indigo-500" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">{t.profile.deliveryAddress}</p>
                        </div>
                        <div className="space-y-4">
                            {/* Adresse */}
                            <div className="space-y-2">
                                <label className={`block text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 flex items-center justify-between`}>
                                    <span>{t.profile.address}</span>
                                    <span className="text-[10px] text-gray-400 lowercase font-medium tracking-normal">({t.profile.optional})</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </span>
                                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                                        placeholder={t.profile.placeholderAddress}
                                        className="block w-full border-2 border-indigo-100 bg-white py-4 pl-12 pr-4 text-sm font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all rounded-2xl placeholder:opacity-40" />
                                </div>
                            </div>

                            {/* City + PostalCode side by side */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-gray-500">{t.profile.city}</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center">
                                            <Building2 className="h-5 w-5 text-gray-400" />
                                        </span>
                                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                                            placeholder={t.profile.placeholderCity}
                                            className="block w-full border-2 border-indigo-100 bg-white py-4 pl-12 pr-4 text-sm font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all rounded-2xl placeholder:opacity-40" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-gray-500">{t.profile.zip}</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center">
                                            <Hash className="h-5 w-5 text-gray-400" />
                                        </span>
                                        <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                                            placeholder={t.profile.placeholderZip}
                                            className="block w-full border-2 border-indigo-100 bg-white py-4 pl-12 pr-4 text-sm font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all rounded-2xl placeholder:opacity-40" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-700 text-[11px] font-black text-center bg-red-50 p-4 rounded-2xl border border-red-200 uppercase tracking-widest shadow-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="text-green-700 text-[11px] font-black text-center bg-green-50 p-4 rounded-2xl border border-green-200 uppercase tracking-widest shadow-sm">
                            {success}
                        </div>
                    )}

                    <div className="pt-2">
                        <button type="submit" disabled={loading || uploading}
                            className="w-full flex justify-center items-center bg-gradient-to-r from-gray-900 to-gray-800 group hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1 py-5 rounded-2xl text-[12px] font-black text-white focus:outline-none disabled:opacity-50 disabled:hover:translate-y-0 uppercase tracking-[0.2em] transition-all duration-300">
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                                    {t.profile.save || "Enregistrer"}
                                    <Sparkles className="w-4 h-4 opacity-50" />
                                </span>
                            )}
                        </button>
                    </div>
                </form>
                </div>
                )}

                {/* ── Section Historique d'Achats ── */}
                {activeTab === 'history' && (
                    <div className="animate-in fade-in duration-500">
                        <h2 className={`text-2xl font-black uppercase tracking-tight text-gray-900 mb-8 ${dir === 'rtl' ? 'text-right' : ''}`}>
                            {language === 'ar' ? 'تاريخ المشتريات' : "Mon Historique d'Achats"}
                        </h2>
                        {loadingOrders ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>
                        ) : orders.length === 0 ? (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-4">
                                    {language === 'ar' ? 'لم تقم بأي طلب بعد' : "Vous n'avez pas encore passé de commande."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {orders.map(order => (
                                    <div key={order.id} className={`bg-white border rounded-2xl p-6 shadow-sm transition-all ${order.paymentStatus === 'failed' ? 'opacity-80 border-red-200 bg-red-50/30 grayscale-[30%]' : 'hover:shadow-md'} ${dir === 'rtl' ? 'text-right' : ''}`}>
                                        <div className={`flex flex-wrap justify-between items-start md:items-center gap-4 mb-4 border-b ${order.paymentStatus === 'failed' ? 'border-red-100' : 'border-gray-100'} pb-4 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                            <div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === 'failed' ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {language === 'ar' ? 'رقم الطلب' : 'Commande'} #{order.documentId ? order.documentId.substring(0,8).toUpperCase() : order.id}
                                                    {order.paymentStatus === 'failed' && <span className={`bg-red-100 text-red-700 px-2 py-0.5 rounded text-[8px] ${dir === 'rtl' ? 'mr-2' : 'ml-2'}`}>{language === 'ar' ? 'ألغيت' : 'ANNULÉ / ÉCHOUÉ'}</span>}
                                                </span>
                                                <p className={`text-sm font-bold ${order.paymentStatus === 'failed' ? 'text-red-900 line-through decoration-red-500 decoration-2' : 'text-gray-900'}`}>{new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-xl md:text-2xl font-black uppercase flex items-baseline gap-1 ${order.paymentStatus === 'failed' ? 'text-red-400 line-through decoration-red-500 decoration-2' : 'text-indigo-600'}`}>{Number(order.total).toFixed(3)} <span className="text-[12px]">TND</span></span>
                                            </div>
                                        </div>

                                        {/* SUIVI DE COMMANDE */}
                                        {order.paymentStatus === 'failed' ? (
                                             <div className="mt-6 mb-8 pt-6 border-t border-red-100 flex flex-col items-center justify-center gap-3">
                                                 <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-[3px] border-red-500 text-red-500 shadow-sm bg-white">✕</div>
                                                 <p className="text-[11px] font-black uppercase tracking-widest text-red-500">
                                                     {language === 'ar' ? 'لم يتم استكمال أو تم إلغاء هذه الطلبية' : 'Cette commande n\'a pas abouti'}
                                                 </p>
                                             </div>
                                        ) : (
                                            <div className="mt-6 mb-8 pt-6 border-t border-gray-100">
                                                <p className={`text-[11px] font-black uppercase text-gray-400 mb-6 ${dir === 'rtl' ? 'text-right' : ''}`}>
                                                    {language === 'ar' ? 'حالة الطلب' : 'Suivi de Commande'}
                                                </p>
                                                
                                                <div className="relative">
                                                    <div className={`absolute top-4 h-1 bg-gray-100 z-0 ${dir === 'rtl' ? 'right-[12.5%] left-[12.5%]' : 'left-[12.5%] right-[12.5%]'}`}></div>
                                                    <div className={`absolute top-4 h-1 z-0 transition-all duration-1000 ${order.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-indigo-600'} ${dir === 'rtl' ? 'right-[12.5%]' : 'left-[12.5%]'}`} 
                                                         style={{ width: (['pending', 'emballage', 'en_livraison', 'paid'].indexOf(order.paymentStatus || 'pending') * 33.33) + '%' }}></div>
                                                    
                                                    <div className={`flex justify-between items-start relative z-10 w-full ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                                        {['pending', 'emballage', 'en_livraison', 'paid'].map((step, index) => {
                                                            const isCompleted = ['pending', 'emballage', 'en_livraison', 'paid'].indexOf(order.paymentStatus || 'pending') >= index;
                                                            const isCurrent = order.paymentStatus === step || (order.paymentStatus === 'pending' && step === 'pending');
                                                            const label = step === 'pending' ? (language === 'ar' ? 'تم التأكيد' : 'Confirmé') :
                                                                          step === 'emballage' ? (language === 'ar' ? 'التغليف' : 'Emballage') :
                                                                          step === 'en_livraison' ? (language === 'ar' ? 'التوصيل' : 'En livraison') :
                                                                          (language === 'ar' ? 'مكتمل' : 'Payé');
                                                                          
                                                            return (
                                                                <div key={step} className="flex flex-col items-center relative w-1/4">
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-[3px] transition-all duration-500 shadow-sm bg-white 
                                                                        ${isCompleted 
                                                                            ? (step === 'paid' ? 'border-green-500 text-green-500 shadow-green-100' : 'border-indigo-600 text-indigo-600 shadow-indigo-100') 
                                                                            : 'border-gray-200 text-gray-300'}`}>
                                                                        {isCompleted && step === 'paid' ? '✓' : (index + 1)}
                                                                    </div>
                                                                    <span className={`text-[10px] md:text-xs font-bold mt-3 uppercase tracking-widest text-center transition-colors w-full
                                                                        ${isCurrent 
                                                                            ? (step === 'paid' ? 'text-green-600 drop-shadow-sm' : 'text-indigo-600 drop-shadow-sm') 
                                                                            : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                                                                        {label}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-4 mt-6">
                                            {order.items && order.items.length > 0 ? order.items.map((item: any, idx: number) => (
                                                <div key={idx} className={`flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all ${dir === 'rtl' ? 'flex-row-reverse text-right' : ''}`}>
                                                    <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-gray-100 flex items-center justify-center">
                                                        {item.product?.cover?.url || item.product?.image?.[0]?.url || item.product?.gallery?.[0]?.url ? (
                                                            <img 
                                                                src={getStrapiMedia(item.product?.cover?.url || item.product?.image?.[0]?.url || item.product?.gallery?.[0]?.url)} 
                                                                alt={item.productName}
                                                                className="h-full w-full object-cover transition-transform hover:scale-110"
                                                            />
                                                        ) : (
                                                            <span className="text-[8px] font-black uppercase text-gray-300">NO IMG</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-1 flex-col justify-between">
                                                        <div className={`flex justify-between items-start ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                                            <h4 className="font-bold text-gray-900 line-clamp-2 text-sm">{item.productName}</h4>
                                                            <span className="font-black text-indigo-600 whitespace-nowrap ml-4">
                                                                {item.priceAtPurchase || (item.total/item.quantity).toFixed(3)} TND
                                                            </span>
                                                        </div>
                                                        <div className={`flex flex-wrap items-center gap-2 mt-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                                            {item.selectedSize && (
                                                                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded">
                                                                    {language === 'ar' ? 'المقاس:' : 'Taille:'} {item.selectedSize}
                                                                </span>
                                                            )}
                                                            {item.selectedColor && (
                                                                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded">
                                                                    {language === 'ar' ? 'اللون:' : 'Couleur:'} {item.selectedColor}
                                                                </span>
                                                            )}
                                                            <span className="bg-white border text-gray-600 px-2 py-0.5 text-[9px] font-black rounded">
                                                                {language === 'ar' ? 'الكمية:' : 'Qté:'} {item.quantity}
                                                            </span>
                                                            <span className="text-gray-400 text-[9px] font-bold px-2 py-0.5">
                                                                Total: {item.total} TND
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                                    <span className="text-[11px] text-gray-400 font-medium tracking-widest uppercase">
                                                        {language === 'ar' ? 'تفاصيل غير متوفرة' : 'Détails non disponibles'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
