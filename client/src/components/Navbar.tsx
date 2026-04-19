import React, { useState, type KeyboardEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getStrapiMedia } from "../lib/api";
import { ShoppingBag, Search, Menu, X, Globe, MapPin } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import type { Language } from "../i18n/translations";


import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { FlashSale, StrapiSingleResponse, BannerConfig } from "../types";
import { UserBadge } from "./UserBadge";

export function Navbar() {
    const { data: flashSale } = useQuery({
        queryKey: ["flash-sale-nav"],
        queryFn: async () => {
            const res = await api.get<StrapiSingleResponse<FlashSale>>("/flash-sale");
            return res.data.data;
        },
        staleTime: 60 * 1000, // 1 minute cache
    });

    const { data: bannerConfig } = useQuery({
        queryKey: ["banner-config-nav"],
        queryFn: async () => {
            const res = await api.get<StrapiSingleResponse<BannerConfig>>("/banner-config");
            return res.data.data;
        },
        staleTime: 60000,
    });

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { cartCount } = useCart();
    const { user, logout } = useAuth();
    const { language, setLanguage, t, dir } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setIsMenuOpen(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const languages: { code: Language; label: string }[] = [
        { code: "fr", label: "Français" },
        { code: "en", label: "English" },
        { code: "ar", label: "العربية" },
    ];

    return (
        <header className="sticky top-0 z-[50] w-full bg-white text-black font-sans shadow-sm">
            {/* Top Info Bar */}
            <div className="bg-[#181818] text-white py-2 px-4 border-b border-white/5 overflow-hidden">
                <div className="container mx-auto max-w-[1400px]">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-8 text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] text-center">
                        <Link to="/stores" className="flex items-center gap-2 hover:text-gray-300 transition-colors group hover:underline underline-offset-4">
                            <MapPin className="h-3 w-3 text-red-600 group-hover:scale-110 transition-transform shrink-0" />
                            <span>Oussama Shoes - Kelibia : 8090 Avenue du Hammadi Gharbi, Kelibia</span>
                        </Link>
                        <span className="opacity-20 hidden md:inline text-lg">|</span>
                        <Link to="/stores" className="flex items-center gap-2 hover:text-gray-300 transition-colors group hover:underline underline-offset-4">
                            <MapPin className="h-3 w-3 text-red-600 group-hover:scale-110 transition-transform shrink-0" />
                            <span>Oussama Shoes - Nabeul : Route beni Khiar-Nabeul (Près Maison Hyundai)</span>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="container flex h-20 items-center justify-between px-4 max-w-[1400px] mx-auto">
                {/* Mobile Menu Button - Left */}
                <button
                    className="md:hidden p-2 -ml-2 text-black"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>

                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <span className="text-xl md:text-2xl font-black tracking-tighter italic uppercase whitespace-nowrap">OUSSAMA SHOES</span>
                </Link>

                {/* Center: Navigation (Desktop) */}
                <nav className="hidden md:flex items-center gap-x-8 text-[11px] font-black uppercase tracking-widest ml-8">
                    <Link to="/products?category=HOMME" className="hover:underline underline-offset-4 whitespace-nowrap">{t.nav.homme}</Link>
                    <Link to="/products?category=FEMME" className="hover:underline underline-offset-4 whitespace-nowrap">{t.nav.femme}</Link>
                    <Link to="/products?category=ENFANTS" className="hover:underline underline-offset-4 whitespace-nowrap">{t.nav.enfants}</Link>
                    <Link to="/products?category=NOUVEAUTÉS" className="hover:underline underline-offset-4 whitespace-nowrap">{t.nav.nouveautes}</Link>
                    <Link to="/promotions" className="hover:underline underline-offset-4 text-orange-600 whitespace-nowrap">{language === 'ar' ? 'تخفيضات' : 'Promotions'}</Link>
                    {flashSale?.isActive && (
                        <Link to="/offres" className="hover:underline underline-offset-4 text-red-600 animate-pulse whitespace-nowrap">{t.nav.offres}</Link>
                    )}
                    <Link to="/stores" className="hover:underline underline-offset-4 whitespace-nowrap">{t.nav.boutiques}</Link>
                    <Link to="/contact" className={`hover:underline underline-offset-4 whitespace-nowrap ${location.pathname === '/contact' ? 'text-red-600' : 'text-red-500'}`}>{t.nav.contact}</Link>
                </nav>

                {/* Right: Icons & Lang */}
                <div className="flex items-center gap-2 md:gap-5 rtl:gap-reverse">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative hidden xl:block group">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t.nav.search}
                            className={`bg-gray-50 border-none rounded-none px-4 py-2 text-[10px] w-32 focus:outline-none focus:ring-0 placeholder:text-gray-400 font-black uppercase tracking-widest transition-all group-hover:bg-gray-100 ${dir === 'rtl' ? 'text-right' : ''}`}
                        />
                        <button type="submit" className={`absolute ${dir === 'rtl' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2`}>
                            <Search className="h-3 w-3 text-gray-400 hover:text-black transition-colors" />
                        </button>
                    </form>

                    {user ? (
                        <div className="relative flex items-center h-10">
                            <button
                                onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsLangOpen(false); }}
                                className="focus:outline-none transition-transform active:scale-95 shrink-0"
                            >
                                <UserBadge 
                                    createdAt={user.createdAt} 
                                    userName={user.username} 
                                    avatarUrl={user.avatar?.url ? getStrapiMedia(user.avatar.url) || undefined : undefined}
                                    showLabel={false}
                                />
                            </button>
    {isUserMenuOpen && (
                                <>
                                    {/* Click outside to close */}
                                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                                    <div className={`absolute top-full ${dir === 'rtl' ? 'left-0' : 'right-0'} w-48 bg-white shadow-2xl border border-gray-100 py-2 mt-2 z-50 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1`}>
                                        <div className="px-4 py-2 border-b border-gray-50">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{user.username}</p>
                                            <p className="text-[9px] text-gray-300 truncate">{user.email}</p>
                                        </div>
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center gap-2 w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 text-black transition-colors"
                                        >
                                            {t.nav.profile || 'Mon Profil'}
                                        </Link>
                                        <button
                                            onClick={() => { logout(); setIsUserMenuOpen(false); }}
                                            className="flex items-center gap-2 w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 text-red-600 transition-colors"
                                        >
                                            {t.nav.logout || 'Déconnexion'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="flex h-10 items-center justify-center hover:bg-gray-100 px-3 text-[10px] font-black uppercase tracking-widest transition-colors">
                            <span>{t.nav.login}</span>
                        </Link>
                    )}

                    <Link to="/cart" className="relative h-10 w-10 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <ShoppingBag className="h-4 w-4" />
                        {cartCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-black text-white shadow-md">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* Language Switcher - Very Minimal & After Cart */}
                    <div className="relative">
                        <button
                            onClick={() => setIsLangOpen(!isLangOpen)}
                            className="flex items-center justify-center h-10 px-2 hover:bg-gray-50 transition-all text-[9px] font-black text-gray-400 hover:text-black"
                        >
                            <Globe className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden xs:inline">{language.toUpperCase()}</span>
                        </button>

                        {isLangOpen && (
                            <div className={`absolute top-full mt-1 ${dir === 'rtl' ? 'left-0' : 'right-0'} w-32 bg-white border border-gray-100 shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-1`}>
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setLanguage(lang.code);
                                            setIsLangOpen(false);
                                        }}
                                        className={`w-full text-center px-4 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors ${language === lang.code ? "text-red-600 bg-gray-50" : "text-black"
                                            }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-2xl py-10 px-8 flex flex-col space-y-8 animate-in slide-in-from-top-2 z-[60]">
                    {/* Search Bar (Mobile) */}
                    <form onSubmit={handleSearch} className="relative group">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t.nav.search}
                            className={`bg-gray-50 border-none rounded-none px-4 py-4 text-xs w-full focus:outline-none focus:ring-0 placeholder:text-gray-400 font-black uppercase tracking-widest transition-all ${dir === 'rtl' ? 'text-right' : ''}`}
                        />
                        <button type="submit" className={`absolute ${dir === 'rtl' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2`}>
                            <Search className="h-4 w-4 text-black" />
                        </button>
                    </form>

                    <div className="flex flex-col space-y-5">
                        <Link to="/products?category=HOMME" className="text-sm font-black uppercase tracking-[0.2em]" onClick={() => setIsMenuOpen(false)}>{t.nav.homme}</Link>
                        <Link to="/products?category=FEMME" className="text-sm font-black uppercase tracking-[0.2em]" onClick={() => setIsMenuOpen(false)}>{t.nav.femme}</Link>
                        <Link to="/products?category=ENFANTS" className="text-sm font-black uppercase tracking-[0.2em]" onClick={() => setIsMenuOpen(false)}>{t.nav.enfants}</Link>
                        <Link to="/products?category=NOUVEAUTÉS" className="text-sm font-black uppercase tracking-[0.2em]" onClick={() => setIsMenuOpen(false)}>{t.nav.nouveautes}</Link>
                        <Link to="/promotions" className="text-sm font-black uppercase tracking-[0.2em] text-orange-600" onClick={() => setIsMenuOpen(false)}>{language === 'ar' ? 'تخفيضات' : 'Promotions'}</Link>
                        {flashSale?.isActive && (
                            <Link to="/offres" className="text-sm font-black uppercase tracking-[0.2em] text-red-600 animate-pulse" onClick={() => setIsMenuOpen(false)}>{t.nav.offres}</Link>
                        )}
                        <Link to="/stores" className="text-sm font-black uppercase tracking-[0.2em]" onClick={() => setIsMenuOpen(false)}>{t.nav.boutiques}</Link>
                        <Link to="/contact" className="text-sm font-black uppercase tracking-[0.2em] text-red-600" onClick={() => setIsMenuOpen(false)}>{t.nav.contact}</Link>
                    </div>

                    {/* Language Switcher - Mobile */}
                    <div className="border-t border-gray-200 pt-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">{language === 'ar' ? 'اللغة' : 'Langue'}</p>
                        <div className="grid grid-cols-3 gap-3">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setIsMenuOpen(false);
                                    }}
                                    className={`py-4 text-[10px] font-black uppercase tracking-widest border-2 transition-all ${language === lang.code ? "border-black bg-black text-white scale-95 shadow-xl" : "border-gray-100"
                                        }`}
                                >
                                    {lang.code.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {user ? (
                        <div className="border-t border-gray-100 pt-8 flex flex-col space-y-6">
                            <div className="bg-black p-4 rounded-xl flex items-center justify-between shadow-xl">
                                <UserBadge 
                                    createdAt={user.createdAt} 
                                    userName={user.username} 
                                    avatarUrl={user.avatar?.url ? getStrapiMedia(user.avatar.url) || undefined : undefined}
                                    showLabel={true}
                                />
                            </div>
                            <div className="flex flex-col space-y-4">
                                <Link to="/profile" className="text-sm font-black uppercase tracking-[0.2em]" onClick={() => setIsMenuOpen(false)}>Mon Profil</Link>
                                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-left text-sm font-black uppercase tracking-[0.2em] text-red-600">Déconnexion</button>
                            </div>
                        </div>
                    ) : (
                        <div className="border-t border-gray-100 pt-8 flex flex-col space-y-5">
                            <Link to="/login" className="text-sm font-black uppercase tracking-[0.2em]" onClick={() => setIsMenuOpen(false)}>{t.nav.login}</Link>
                            <Link to="/register" className="text-sm font-black uppercase tracking-[0.2em] text-red-600" onClick={() => setIsMenuOpen(false)}>Créer un compte</Link>
                        </div>
                    )}
                </div>
            )}
            {/* Announcement Bar (Below Navbar) */}
            {bannerConfig?.showAnnouncement && bannerConfig.announcementText && (
                <div className="w-full bg-red-600 text-white py-3 overflow-hidden border-t border-red-500 shadow-inner relative z-30">
                    <div className="animate-marquee whitespace-nowrap flex items-center gap-12 max-w-full">
                        <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] px-4">
                            {bannerConfig.announcementText}
                        </span>
                        {/* Repeat for continuous effect */}
                        <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] px-4 hidden md:inline">
                            {bannerConfig.announcementText}
                        </span>
                        <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] px-4 hidden lg:inline">
                            {bannerConfig.announcementText}
                        </span>
                    </div>
                </div>
            )}
        </header>
    );
}
