import { useState, type SyntheticEvent, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Loader2, User, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function Profile() {
    const { user, token, login } = useAuth();
    const { t, dir } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user && !token) {
            navigate("/login");
        }
    }, [user, token, navigate]);

    const [username, setUsername] = useState(user?.username || "");
    const [email, setEmail] = useState(user?.email || "");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setEmail(user.email);
        }
    }, [user]);

    const handleUpdateProfile = async (e: SyntheticEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            const response = await api.put(`/users/${user?.id}`, {
                username,
                email,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            login(token!, response.data);
            setSuccess(t.profile.success);
        } catch (err: any) {
            console.error("Update profile error:", err);
            if (err.response?.data?.error?.message) {
                setError(err.response.data.error.message);
            } else {
                setError(t.profile.error);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="container max-w-2xl px-4 py-12 md:py-24 mx-auto">
            <h1 className={`text-4xl font-black uppercase tracking-tight mb-12 ${dir === 'rtl' ? 'text-right' : ''}`}>{t.profile.title}</h1>

            <div className="bg-white shadow-2xl border border-gray-100 p-8 md:p-12">
                <div className={`flex items-center space-x-6 mb-12 ${dir === 'rtl' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className="h-20 w-20 bg-black rounded-full flex items-center justify-center text-white text-3xl font-black">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className={dir === 'rtl' ? 'text-right' : ''}>
                        <h2 className="text-2xl font-black uppercase tracking-tight">{user.username}</h2>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">
                            {t.profile.memberSince} {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className={`block text-[10px] font-black uppercase tracking-widest text-gray-400 ${dir === 'rtl' ? 'text-right' : ''}`}>{t.auth.username}</label>
                            <div className="relative">
                                <span className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center`}>
                                    <User className="h-4 w-4 text-gray-400" />
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className={`block w-full border-2 border-gray-100 bg-gray-50 py-4 ${dir === 'rtl' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} text-sm font-bold focus:border-black focus:outline-none transition-all`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`block text-[10px] font-black uppercase tracking-widest text-gray-400 ${dir === 'rtl' ? 'text-right' : ''}`}>{t.auth.email}</label>
                            <div className="relative">
                                <span className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center`}>
                                    <Mail className="h-4 w-4 text-gray-400" />
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`block w-full border-2 border-gray-100 bg-gray-50 py-4 ${dir === 'rtl' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} text-sm font-bold focus:border-black focus:outline-none transition-all`}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-[10px] font-black text-center bg-red-50 p-4 border-2 border-red-100 uppercase tracking-widest">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="text-green-600 text-[10px] font-black text-center bg-green-50 p-4 border-2 border-green-100 uppercase tracking-widest">
                            {success}
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center bg-black py-5 text-[11px] font-black text-white hover:bg-gray-800 focus:outline-none disabled:opacity-50 uppercase tracking-[0.2em] transition-all"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                t.profile.save
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
