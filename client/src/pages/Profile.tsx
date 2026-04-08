import { useState, useRef, type SyntheticEvent, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api, STRAPI_URL } from "../lib/api";
import { Loader2, User, Mail, Phone, Camera, CalendarDays, Sparkles, MapPin, Building2, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";

export default function Profile() {
    const { user, token, login } = useAuth();
    const { t, dir } = useLanguage();
    const navigate = useNavigate();

    const [username, setUsername] = useState(user?.username || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                setUsername(freshUser.username);
                setEmail(freshUser.email);
                if (freshUser.phone) setPhone(freshUser.phone);
                if (freshUser.address) setAddress(freshUser.address);
                if (freshUser.city) setCity(freshUser.city);
                if (freshUser.postalCode) setPostalCode(freshUser.postalCode);

                if (freshUser.avatar?.url) {
                    setAvatarUrl(
                        freshUser.avatar.url.startsWith("http")
                            ? freshUser.avatar.url
                            : `${STRAPI_URL}${freshUser.avatar.url}`
                    );
                }
            }).catch(console.error);
        }
    }, [user?.id, token, navigate]);

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
            const uploadRes = await axios.post(`${STRAPI_URL}/api/user-upload`, formData, {
                headers: { Authorization: `Bearer ${freshToken}` }
            });

            const avatarId = uploadRes.data[0].id;

            const updateRes = await api.put(`/users/${user?.id}`, {
                avatar: avatarId
            }, {
                headers: { Authorization: `Bearer ${freshToken}` }
            });

            login(freshToken!, updateRes.data);

            const newUrl = uploadRes.data[0].url;
            setAvatarUrl(newUrl.startsWith("http") ? newUrl : `${STRAPI_URL}${newUrl}`);
            setSuccess("Image de profil mise a jour avec succes !");
        } catch (err: any) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.error?.message || err?.message || "Erreur inconnue";
            setError(`Erreur ${status || ""}: ${msg}`);
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
            const response = await api.put(`/users/${user?.id}`, {
                username,
                email,
                phone,
                address,
                city,
                postalCode,
            }, {
                headers: { Authorization: `Bearer ${freshToken}` }
            });

            login(freshToken!, response.data);
            setSuccess(t.profile.success || "Profil mis a jour avec succes !");
        } catch (err: any) {
            if (err.response?.data?.error?.message) {
                setError(err.response.data.error.message);
            } else {
                setError(t.profile.error || "Erreur de mise a jour");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="container max-w-2xl px-4 py-12 md:py-24 mx-auto">
            <h1 className={`text-4xl font-black uppercase tracking-tight mb-12 ${dir === "rtl" ? "text-right" : ""}`}>
                {t.profile.title || "Mon Profil"}
            </h1>

            <div className="bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-100 p-8 md:p-12 relative overflow-hidden rounded-3xl">
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
                            {username}
                        </h2>
                        <div className={`inline-flex items-center space-x-2 bg-gradient-to-l from-indigo-50 to-purple-50 border border-indigo-100/50 text-indigo-700 px-5 py-2.5 mt-4 rounded-full shadow-sm font-semibold text-xs tracking-wider uppercase ${dir === "rtl" ? "space-x-reverse" : ""}`}>
                            <CalendarDays className="w-[18px] h-[18px] text-indigo-600" />
                            <span>{t.profile.memberSince || "Membre depuis"} {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-8 relative z-10">

                    {/* ── Section Infos personnelles ── */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">Informations personnelles</p>
                        <div className="space-y-4">
                            {/* Username */}
                            <div className="space-y-2">
                                <label className={`block text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 ${dir === "rtl" ? "text-right" : ""}`}>{t.auth.username || "Nom Utilisateur"}</label>
                                <div className="relative">
                                    <span className={`absolute inset-y-0 ${dir === "rtl" ? "right-0 pr-4" : "left-0 pl-4"} flex items-center`}>
                                        <User className="h-5 w-5 text-gray-400" />
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
                                    <span>Telephone</span>
                                    <span className="text-[10px] text-gray-400 lowercase font-medium tracking-normal">(Optionnel)</span>
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
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Adresse de livraison</p>
                        </div>
                        <div className="space-y-4">
                            {/* Adresse */}
                            <div className="space-y-2">
                                <label className={`block text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 flex items-center justify-between`}>
                                    <span>Adresse</span>
                                    <span className="text-[10px] text-gray-400 lowercase font-medium tracking-normal">(Optionnel)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </span>
                                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Ex: 12 Rue de la Paix"
                                        className="block w-full border-2 border-indigo-100 bg-white py-4 pl-12 pr-4 text-sm font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all rounded-2xl placeholder:opacity-40" />
                                </div>
                            </div>

                            {/* City + PostalCode side by side */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-gray-500">Ville</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center">
                                            <Building2 className="h-5 w-5 text-gray-400" />
                                        </span>
                                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                                            placeholder="Ex: Nabeul"
                                            className="block w-full border-2 border-indigo-100 bg-white py-4 pl-12 pr-4 text-sm font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all rounded-2xl placeholder:opacity-40" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-gray-500">Code Postal</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center">
                                            <Hash className="h-5 w-5 text-gray-400" />
                                        </span>
                                        <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                                            placeholder="Ex: 8000"
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
        </div>
    );
}
