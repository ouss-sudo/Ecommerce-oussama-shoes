import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Register() {
    const { t, dir } = useLanguage();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await api.post("/auth/local/register", {
                username,
                email,
                password,
            });

            const { jwt, user } = response.data;
            login(jwt, user);
            navigate("/");
        } catch (err: any) {
            console.error("Registration error:", err);
            if (err.response?.data?.error?.message) {
                setError(err.response.data.error.message);
            } else {
                setError(t.contact.error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-24">
            <div className="w-full max-w-md space-y-10 bg-white p-10 shadow-2xl border border-gray-100">
                <div className="text-center">
                    <h2 className="text-4xl font-black tracking-tighter text-gray-900 uppercase">
                        {t.auth.registerTitle}
                    </h2>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        {t.auth.haveAccount}{" "}
                        <Link to="/login" className="text-black border-b-2 border-black pb-0.5 hover:text-red-600 hover:border-red-600 transition-colors">
                            {t.auth.loginLink}
                        </Link>
                    </p>
                </div>
                <form className="space-y-8" onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {t.auth.username}
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                className={`block w-full border-2 border-gray-100 bg-gray-50 py-4 px-4 text-sm font-bold text-gray-900 focus:border-black focus:outline-none transition-all placeholder:text-gray-300 ${dir === 'rtl' ? 'text-right' : ''}`}
                                placeholder={t.auth.username}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {t.auth.email}
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className={`block w-full border-2 border-gray-100 bg-gray-50 py-4 px-4 text-sm font-bold text-gray-900 focus:border-black focus:outline-none transition-all placeholder:text-gray-300 ${dir === 'rtl' ? 'text-right' : ''}`}
                                placeholder={t.auth.email}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {t.auth.password}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className={`block w-full border-2 border-gray-100 bg-gray-50 py-4 px-4 text-sm font-bold text-gray-900 focus:border-black focus:outline-none transition-all placeholder:text-gray-300 ${dir === 'rtl' ? 'text-right' : ''}`}
                                placeholder={t.auth.password}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-[10px] font-black text-center bg-red-50 p-4 border-2 border-red-100 uppercase tracking-widest">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center bg-black py-5 text-[11px] font-black text-white hover:bg-gray-800 focus:outline-none disabled:opacity-50 uppercase tracking-[0.2em] transition-all"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            t.auth.registerBtn
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
