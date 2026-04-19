import { useState, useEffect, type SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Loader2, User, Mail, Lock, Calendar, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { triggerFireworkBurst } from "../lib/celebration";

export default function Register() {
    const { t, dir, language } = useLanguage();
    const navigate = useNavigate();
    const { login, user } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);

    // Form states
    const [gender, setGender] = useState("m");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [partnersOptIn, setPartnersOptIn] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [newsletterOptIn, setNewsletterOptIn] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!termsAccepted) {
            setError(language === 'ar' ? "يرجى قبول الشروط والأحكام" : "Veuillez accepter les conditions générales");
            return;
        }
        
        setError(null);
        setLoading(true);

        try {
            // Strapi requires a username, we'll use email as username
            const response = await api.post("/auth/local/register", {
                username: email, 
                email,
                password,
                gender,
                firstName,
                lastName,
                birthDate: birthDate || null,
                newsletterOptIn,
                partnersOptIn
            });

            const { jwt } = response.data;
            
            // Fetch full user with avatar populated
            const userRes = await api.get("/users/me?populate=avatar", {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            
            const fullUser = userRes.data;
            login(jwt, fullUser);
            triggerFireworkBurst();
            setTimeout(() => {
                navigate("/");
            }, 1000);
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
            <div className="w-full max-w-xl space-y-10 bg-white p-6 md:p-12 shadow-2xl border border-gray-100">
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900 uppercase">
                        {t.auth.registerTitle}
                    </h2>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        {t.auth.haveAccount}{" "}
                        <Link to="/login" className="text-black border-b-2 border-black pb-0.5 hover:text-red-600 hover:border-red-600 transition-colors">
                            {t.auth.loginLink}
                        </Link>
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Gender Selection */}
                    <div className={`flex items-center gap-8 mb-8 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="radio" 
                                name="gender" 
                                value="m" 
                                checked={gender === 'm'} 
                                onChange={(e) => setGender(e.target.value)}
                                className="w-4 h-4 accent-black"
                            />
                            <span className="text-[11px] font-black uppercase tracking-widest text-gray-600 group-hover:text-black">m</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="radio" 
                                name="gender" 
                                value="mme" 
                                checked={gender === 'mme'} 
                                onChange={(e) => setGender(e.target.value)}
                                className="w-4 h-4 accent-black"
                            />
                            <span className="text-[11px] font-black uppercase tracking-widest text-gray-600 group-hover:text-black">mme</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div className="space-y-2">
                            <div className="relative group">
                                <User className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-black transition-colors`} />
                                <input
                                    type="text"
                                    required
                                    placeholder={language === 'ar' ? "الاسم الأول" : "Prénom"}
                                    className={`block w-full border-2 border-gray-100 bg-gray-50 py-4 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm font-bold text-gray-900 focus:border-black focus:outline-none transition-all placeholder:text-gray-300 ${dir === 'rtl' ? 'text-right' : ''}`}
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Last Name */}
                        <div className="space-y-2">
                            <div className="relative group">
                                <User className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-black transition-colors`} />
                                <input
                                    type="text"
                                    required
                                    placeholder={language === 'ar' ? "اللقب" : "Nom"}
                                    className={`block w-full border-2 border-gray-100 bg-gray-50 py-4 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm font-bold text-gray-900 focus:border-black focus:outline-none transition-all placeholder:text-gray-300 ${dir === 'rtl' ? 'text-right' : ''}`}
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <div className="relative group">
                            <Mail className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-black transition-colors`} />
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                placeholder={language === 'ar' ? "البريد الإلكتروني" : "E-mail"}
                                className={`block w-full border-2 border-gray-100 bg-gray-50 py-4 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm font-bold text-gray-900 focus:border-black focus:outline-none transition-all placeholder:text-gray-300 ${dir === 'rtl' ? 'text-right' : ''}`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <div className="relative group">
                            <Lock className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-black transition-colors`} />
                            <input
                                type="password"
                                required
                                autoComplete="new-password"
                                placeholder={language === 'ar' ? "كلمة المرور" : "Mot de passe"}
                                className={`block w-full border-2 border-gray-100 bg-gray-50 py-4 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm font-bold text-gray-900 focus:border-black focus:outline-none transition-all placeholder:text-gray-300 ${dir === 'rtl' ? 'text-right' : ''}`}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Birth Date */}
                    <div className="space-y-2">
                        <div className="relative group">
                            <Calendar className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-black transition-colors`} />
                            <input
                                type="date"
                                placeholder="DD/MM/YYYY"
                                className={`block w-full border-2 border-gray-100 bg-gray-50 py-4 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm font-bold text-gray-900 focus:border-black focus:outline-none transition-all placeholder:text-gray-300 ${dir === 'rtl' ? 'text-right' : ''}`}
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                            <span className={`absolute ${dir === 'rtl' ? 'left-12' : 'right-12'} top-1/2 -translate-y-1/2 text-[9px] font-black italic text-gray-300 uppercase tracking-widest pointer-events-none`}>optionnel</span>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        {/* Partners Checkbox */}
                        <label className={`flex items-start gap-3 cursor-pointer group ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                            <div className="relative pt-1">
                                <input 
                                    type="checkbox" 
                                    className="peer sr-only" 
                                    checked={partnersOptIn}
                                    onChange={(e) => setPartnersOptIn(e.target.checked)}
                                />
                                <div className="h-5 w-5 border-2 border-gray-200 peer-checked:border-black peer-checked:bg-black transition-all rounded-sm flex items-center justify-center">
                                    <CheckCircle2 className="h-3 w-3 text-white scale-0 peer-checked:scale-100 transition-transform" />
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">
                                {language === 'ar' ? "تلقي عروض من شركائنا" : "recevoir les offres de nos partenaires"}
                            </span>
                        </label>

                        {/* Privacy Checkbox */}
                        <label className={`flex items-start gap-3 cursor-pointer group ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                            <div className="relative pt-1">
                                <input 
                                    type="checkbox" 
                                    className="peer sr-only" 
                                    checked={privacyAccepted}
                                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                />
                                <div className="h-5 w-5 border-2 border-gray-200 peer-checked:border-black peer-checked:bg-black transition-all rounded-sm flex items-center justify-center">
                                    <CheckCircle2 className="h-3 w-3 text-white scale-0 peer-checked:scale-100 transition-transform" />
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">
                                {language === 'ar' ? "رسالة بخصوص سرية بيانات العملاء" : "message concernant la confidentialité des données clients"}
                            </span>
                        </label>

                        {/* Newsletter Checkbox */}
                        <label className={`flex items-start gap-3 cursor-pointer group ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                            <div className="relative pt-1">
                                <input 
                                    type="checkbox" 
                                    className="peer sr-only" 
                                    checked={newsletterOptIn}
                                    onChange={(e) => setNewsletterOptIn(e.target.checked)}
                                />
                                <div className="h-5 w-5 border-2 border-gray-200 peer-checked:border-black peer-checked:bg-black transition-all rounded-sm flex items-center justify-center">
                                    <CheckCircle2 className="h-3 w-3 text-white scale-0 peer-checked:scale-100 transition-transform" />
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">
                                {language === 'ar' ? "الاشتراك في النشرة الإخبارية لدينا" : "recevoir notre newsletter"}
                            </span>
                        </label>

                        {/* Terms Checkbox */}
                        <label className={`flex items-start gap-3 cursor-pointer group ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                            <div className="relative pt-1">
                                <input 
                                    type="checkbox" 
                                    required
                                    className="peer sr-only" 
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                />
                                <div className="h-5 w-5 border-2 border-gray-200 peer-checked:border-black peer-checked:bg-black transition-all rounded-sm flex items-center justify-center">
                                    <CheckCircle2 className="h-3 w-3 text-white scale-0 peer-checked:scale-100 transition-transform" />
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black group-hover:text-gray-600 transition-colors">
                                {language === 'ar' ? "أوافق على الشروط العامة وسياسة الخصوصية" : "j'accepte les conditions générales et la politique de confidentialité *"}
                            </span>
                        </label>
                    </div>


                    {error && (
                        <div className="text-red-600 text-[10px] font-black text-center bg-red-50 p-4 border-2 border-red-100 uppercase tracking-widest animate-in shake-in">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center bg-black py-5 text-[11px] font-black text-white hover:bg-gray-800 focus:outline-none disabled:opacity-50 uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95"
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
