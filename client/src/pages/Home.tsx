import { useQuery } from "@tanstack/react-query";
import { api, getStrapiMedia } from "../lib/api";
import type { Product, StrapiResponse } from "../types";
import { Link } from "react-router-dom";
import { Loader2, Package, CreditCard, MessageSquare, Truck } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { ProductCard } from "../components/ProductCard";

export default function Home() {
    const { t, dir, language } = useLanguage();
    const { data: productsData, isLoading } = useQuery({
        queryKey: ["featured-products"],
        queryFn: async () => {
            const res = await api.get<StrapiResponse<Product>>(
                "/products?populate=*"
            );
            return res.data;
        },
    });

    const products = productsData?.data || [];

    // Filter products strictly by category name matching
    const hommeProducts = products.filter(p => p.categories?.some(c => c.name.toLowerCase().includes('homme') || c.name.toLowerCase().includes('men')));
    const femmeProducts = products.filter(p => p.categories?.some(c => c.name.toLowerCase().includes('femme') || c.name.toLowerCase().includes('women')));
    const enfantProducts = products.filter(p => p.categories?.some(c => c.name.toLowerCase().includes('enfant') || c.name.toLowerCase().includes('fille') || c.name.toLowerCase().includes('garçon') || c.name.toLowerCase().includes('kid')));

    const renderCategory = (title: string, bannerImg: string, items: Product[]) => {
        const safeTitle = title.replace(/\s+/g, '-').toLowerCase();

        return (
            <div className="mb-24 w-full">
                {/* Large Banner Image */}
                <div className="w-full h-[400px] md:h-[600px] mb-12 relative overflow-hidden group">
                    <img src={bannerImg} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={title} />
                    <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/40 flex items-center justify-center">
                       <h2 className="text-white text-5xl md:text-8xl font-black uppercase tracking-tighter drop-shadow-2xl">{title}</h2>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-10 px-4">
                    <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                        {language === 'ar' ? `الأكثر مبيعاً ${title}` : `Best sellers ${title}`}
                    </h3>
                    <div className="w-16 h-1 bg-black mx-auto mt-4 mb-8"></div>
                </div>

                {/* Carousel or Empty State */}
                {items.length === 0 ? (
                    <div className="flex justify-center items-center py-10 bg-gray-50 border border-dashed border-gray-200 mx-4 md:mx-10">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs text-center">
                            {language === 'ar' ? 'لا توجد منتجات في هذا القسم حاليا' : 'Aucun produit disponible dans cette catégorie pour le moment.'}
                        </p>
                    </div>
                ) : (
                    <div className="relative w-full overflow-hidden group/carousel bg-white py-4">
                        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                        <div className={`flex gap-6 animate-marquee-${safeTitle} w-max`}>
                            {/* Duplicate arrays for seamless infinite scroll */}
                            {[...items, ...items, ...items, ...items].map((p, i) => (
                                <div key={`${p.documentId}-${i}`} className="w-[65vw] md:w-[280px] shrink-0">
                                    <ProductCard product={p} />
                                </div>
                            ))}
                        </div>

                        <style>{`
                            @keyframes marquee-${safeTitle} {
                                0% { transform: translateX(0); }
                                100% { transform: translateX(-25%); }
                            }
                            .animate-marquee-${safeTitle} {
                                animation: marquee-${safeTitle} 28s linear infinite;
                            }
                            .group\\/carousel:hover .animate-marquee-${safeTitle} {
                                animation-play-state: paused;
                            }
                        `}</style>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#0a0a0c] font-sans">
            {/* Hero Section - Optimized to show complete image without white bars */}
            <section className="relative w-full h-[calc(100vh-80px)] bg-black flex items-center justify-center overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 z-0">
                    <img
                        src={getStrapiMedia("/uploads/crteee.png") || ""}
                        className="w-full h-full object-cover"
                        alt="Hero"
                    />
                </div>

                {/* Subtle Overlay to not block the image content */}
                <div className={`absolute bottom-10 ${dir === 'rtl' ? 'right-1/2 translate-x-1/2' : 'left-1/2 -translate-x-1/2'} z-10 w-full max-w-xl px-6 text-center`}>
                    <div className="bg-black/40 backdrop-blur-md p-6 border border-white/10 inline-block w-full shadow-2xl">
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-2 drop-shadow-xl">
                            {t.home.heroTitle}
                        </h1>
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-6 drop-shadow-md">
                            {t.home.heroDesc}
                        </p>
                        <Link to="/products" className="inline-block bg-white text-black px-10 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-xl">
                            {t.home.heroBtn}
                        </Link>
                    </div>
                </div>
            </section>


            {/* CATEGORIES SECTIONS */}
            <section className="w-full bg-white pt-16 pb-8">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-black" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex justify-center py-20 text-gray-400 font-bold uppercase tracking-widest text-xs">
                        {t.home.noFeatured}
                    </div>
                ) : (
                    <div className="flex flex-col w-full">
                        {renderCategory(
                            language === 'ar' ? 'رجال' : 'Homme',
                            'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=1600&h=800&fit=crop',
                            hommeProducts
                        )}
                        {renderCategory(
                            language === 'ar' ? 'نساء' : 'Femme',
                            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1600&h=800&fit=crop',
                            femmeProducts
                        )}
                        {renderCategory(
                            language === 'ar' ? 'أطفال' : 'Enfant',
                            'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=1600&h=800&fit=crop',
                            enfantProducts
                        )}
                    </div>
                )}
            </section>

            {/* Additional Teaser Section */}
            <section className="w-full h-[500px] bg-black flex items-center justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 flex items-center justify-center pointer-events-none">
                    <span className="text-[20vw] font-black tracking-tighter italic uppercase select-none">OUSSAMA</span>
                </div>
                <div className="text-center space-y-8 relative z-10 px-4">
                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none italic">{t.home.teaserTitle}</h2>
                    <Link to="/products" className="inline-block bg-white text-black px-12 py-5 text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-2xl">
                        {t.home.teaserBtn}
                    </Link>
                </div>
            </section>

            {/* Features / Guarantees Section */}
            <section className="w-full bg-white border-b border-gray-100 py-12 md:py-16">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                        {/* Feature 1 */}
                        <div className="flex items-center gap-4 pt-6 sm:pt-0 sm:px-4 lg:px-8">
                            <Package className="h-8 w-8 text-black shrink-0" strokeWidth={1.5} />
                            <div>
                                <h3 className="text-[13px] font-black">{language === 'ar' ? 'توصيل مجاني' : 'Livraison Gratuite'}</h3>
                                <p className="text-[12px] text-gray-500 mt-0.5">{language === 'ar' ? 'للمشتريات بقيمة 150 دينار أو أكثر' : 'A partir de 150DT d\'achats'}</p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex items-center gap-4 pt-6 sm:pt-0 sm:px-4 lg:px-8">
                            <CreditCard className="h-8 w-8 text-black shrink-0" strokeWidth={1.5} />
                            <div>
                                <h3 className="text-[13px] font-black">{language === 'ar' ? 'دفع آمن' : 'Paiement sécurisé'}</h3>
                                <p className="text-[12px] text-gray-500 mt-0.5">{language === 'ar' ? 'الدفع عند الاستلام' : 'Paiement à la livraison'}</p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex items-center gap-4 pt-6 sm:pt-0 sm:px-4 lg:px-8">
                            <MessageSquare className="h-8 w-8 text-black shrink-0" strokeWidth={1.5} />
                            <div>
                                <h3 className="text-[13px] font-black">{language === 'ar' ? 'رضا مضمون' : 'Satisfaction garantie'}</h3>
                                <p className="text-[12px] text-gray-500 mt-0.5">{language === 'ar' ? 'خدمة عملاء في استماعكم' : 'Un service client à votre écoute'}</p>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="flex items-center gap-4 pt-6 sm:pt-0 sm:px-4 lg:px-8">
                            <Truck className="h-8 w-8 text-black shrink-0" strokeWidth={1.5} />
                            <div>
                                <h3 className="text-[13px] font-black">{language === 'ar' ? 'توصيل سريع' : 'Livraison rapide'}</h3>
                                <p className="text-[12px] text-gray-500 mt-0.5">{language === 'ar' ? 'منتجاتك تصلك خلال 24/48 ساعة' : 'Vos articles en 24/48h chez vous'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
