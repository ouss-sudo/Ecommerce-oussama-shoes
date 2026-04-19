import { useEffect, useRef, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getStrapiMedia } from "../lib/api";
import type { Product, StrapiResponse, FlashSale, StrapiSingleResponse } from "../types";
import { Link } from "react-router-dom";
import { Loader2, Package, CreditCard, MessageSquare, Truck, ChevronLeft, ChevronRight, Sparkles, Clock } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { ProductCard } from "../components/ProductCard";

export default function Home() {
    const { t, dir, language } = useLanguage();

    const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

    const { data: bannerConfig } = useQuery({
        queryKey: ["banner-config-home"],
        queryFn: async () => {
            const res = await api.get("/banner-config?populate=homeHeroSlider1&populate=homeHeroSlider2&populate=homeHeroSlider3");
            return res.data.data;
        },
        staleTime: 60 * 1000,
    });

    const heroSlides = [bannerConfig?.homeHeroSlider1, bannerConfig?.homeHeroSlider2, bannerConfig?.homeHeroSlider3].filter(Boolean);

    useEffect(() => {
        if (heroSlides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentHeroSlide(prev => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [heroSlides.length]);

    const { data: flashSale } = useQuery({
        queryKey: ["flash-sale-home"],
        queryFn: async () => {
            const res = await api.get<StrapiSingleResponse<FlashSale>>("/flash-sale");
            return res.data.data;
        },
        staleTime: 30 * 1000, 
        refetchInterval: 30000, // Refresh every 30 seconds to fix "intermittent display"
    });

    const { data: productsData, isLoading } = useQuery({
        queryKey: ["featured-products"],
        queryFn: async () => {
            const res = await api.get<StrapiResponse<Product>>(
                "/products?fields[0]=name&fields[1]=price_display&fields[2]=slug&populate[0]=cover&populate[1]=image&populate[2]=gallery&populate[3]=categories&pagination[limit]=50&sort=createdAt:desc"
            );
            return res.data;
        },
        placeholderData: (previousData) => previousData, // PERSISTENCE: Keeps old products on screen while loading new ones
        refetchInterval: 60000, // Background refresh every 60 seconds
    });

    const products = productsData?.data || [];
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;
            let scrollTo;
            if (direction === 'left') {
                scrollTo = scrollLeft - clientWidth;
                if (scrollTo < 0) scrollTo = scrollWidth; // Loop to end
            } else {
                scrollTo = scrollLeft + clientWidth;
                if (scrollTo >= scrollWidth - clientWidth) scrollTo = 0; // Loop to start
            }
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    // Auto-scroll effect
    useEffect(() => {
        const interval = setInterval(() => {
            scroll('right');
        }, 3500); // Scroll every 3.5 seconds
        return () => clearInterval(interval);
    }, [products]); // Re-run if products change (e.g. initial load)

    // Filter products strictly by category name or slug matching
    // Filter products strictly by category name matching Strapi data
    // Memoize filtered products to prevent re-filtering on every render
    const hommeProducts = useMemo(() => products.filter(p => p.categories?.some(c => 
        c.name?.toUpperCase() === "HOMME" || c.slug?.toLowerCase() === "homme"
    )), [products]);
    
    const femmeProducts = useMemo(() => products.filter(p => p.categories?.some(c => 
        c.name?.toUpperCase() === "FEMME" || c.slug?.toLowerCase() === "femme"
    )), [products]);
    
    const enfantProducts = useMemo(() => products.filter(p => p.categories?.some(c => 
        c.name?.toUpperCase() === "ENFANTS" || c.slug?.toLowerCase() === "enfants" || c.slug?.toLowerCase() === "enfant"
    )), [products]);

    const renderCategory = (title: string, bannerImg: string, items: Product[]) => {
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
                        {t.home.bestSellers} {title}
                    </h3>
                    <div className="w-16 h-1 bg-black mx-auto mt-4 mb-8"></div>
                </div>

                {/* Carousel or Empty State */}
                {items.length === 0 ? (
                    <div className="flex justify-center items-center py-10 bg-gray-50 border border-dashed border-gray-200 mx-4 md:mx-10">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs text-center">
                            {t.home.noInCategory}
                        </p>
                    </div>
                ) : (
                    <div className="relative w-full overflow-hidden group/carousel bg-white py-4">
                        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                        <div className={`flex gap-6 ${items.length > 4 ? `animate-marquee` : "justify-center mx-auto"} w-max`}>
                            {/* Only duplicate twice instead of 4 times to save DOM memory */}
                            {(items.length > 4 ? [...items, ...items] : items).map((p, i) => (
                                <div key={`${p.documentId}-${i}`} className="w-[65vw] md:w-[280px] shrink-0">
                                    <ProductCard product={p} />
                                </div>
                            ))}
                        </div>

                        {items.length > 4 && (
                            <style>{`
                                .animate-marquee {
                                    animation: marquee ${items.length * 5}s linear infinite;
                                }
                                @keyframes marquee {
                                    0% { transform: translateX(0); }
                                    100% { transform: translateX(-50%); }
                                }
                                .group\\/carousel:hover .animate-marquee {
                                    animation-play-state: paused;
                                }
                            `}</style>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#0a0a0c] font-sans">
            {/* Flash Sale Notification Card */}
            {flashSale?.isActive && (() => {
                const now = new Date();
                const start = flashSale.startAt ? new Date(flashSale.startAt) : null;
                const hasStarted = !start || now >= start;

                if (!hasStarted) return null;

                return (
                    <div className={`fixed bottom-8 ${dir === 'rtl' ? 'left-8' : 'right-8'} z-[60] animate-in slide-in-from-bottom-10 duration-700`}>
                        <Link 
                            to="/offres"
                            className="group block bg-white rounded-3xl p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] hover:scale-105 transition-all duration-500"
                        >
                            <div className="bg-black rounded-[1.4rem] p-6 flex items-center gap-6 relative overflow-hidden">
                                {/* Decorative background element */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/20 rounded-full blur-3xl group-hover:bg-red-600/40 transition-colors" />
                                
                                <div className="h-16 w-16 bg-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
                                    <Sparkles className="h-8 w-8 text-white" />
                                </div>
                                
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                                        <span className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">{t.flashSale.limited}</span>
                                    </div>
                                    <h3 className="text-white text-xl font-black uppercase tracking-tighter leading-none mb-1">
                                        {flashSale.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                        <Clock className="h-3 w-3" />
                                        {t.flashSale.endsIn}
                                    </div>
                                </div>

                                <div className={`ml-4 ${dir === 'rtl' ? 'rotate-180' : ''} group-hover:translate-x-1 transition-transform`}>
                                   <ChevronRight className="h-6 w-6 text-white/20 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </Link>
                    </div>
                );
            })()}

            {/* Hero Section - Dynamic Carousel from Strapi */}
            <section className="relative w-full h-[calc(100vh-80px)] bg-black flex items-center justify-center overflow-hidden border-b border-white/5 group">
                {heroSlides.length > 0 ? (
                    <>
                        {heroSlides.map((slide: any, index: number) => {
                            const isVideo = slide.mime?.startsWith('video/');
                            return (
                                <div 
                                    key={slide.id} 
                                    className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${index === currentHeroSlide ? 'opacity-100' : 'opacity-0'}`}
                                >
                                    {isVideo ? (
                                        <video
                                            src={getStrapiMedia(slide.url) || ""}
                                            className="w-full h-full object-cover"
                                            autoPlay={index === currentHeroSlide}
                                            loop
                                            muted
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            src={getStrapiMedia(slide.url) || ""}
                                            className="w-full h-full object-cover"
                                            alt="Hero Slide"
                                        />
                                    )}
                                </div>
                            );
                        })}

                        {/* Navigation Arrows */}
                        {heroSlides.length > 1 && (
                            <>
                                <button 
                                    onClick={() => setCurrentHeroSlide(prev => prev === 0 ? heroSlides.length - 1 : prev - 1)}
                                    className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/20 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-black/50 transition-all z-20"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button 
                                    onClick={() => setCurrentHeroSlide(prev => (prev + 1) % heroSlides.length)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/20 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-black/50 transition-all z-20"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>
                            </>
                        )}

                        {/* Pagination Dots */}
                        {heroSlides.length > 1 && (
                            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-3">
                                {heroSlides.map((_: any, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentHeroSlide(index)}
                                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentHeroSlide ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70 shadow-lg'}`}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="absolute inset-0 z-0">
                        <img
                            src={getStrapiMedia("/uploads/crteee.png") || ""}
                            className="w-full h-full object-cover"
                            alt="Hero Fallback"
                        />
                    </div>
                )}

                {/* Subtle Overlay to not block the image content */}
                <div className={`absolute bottom-24 ${dir === 'rtl' ? 'right-1/2 translate-x-1/2' : 'left-1/2 -translate-x-1/2'} z-10 w-full max-w-xl px-4 md:px-6 text-center transition-all`}>
                    <div className="bg-black/40 backdrop-blur-md p-6 lg:p-8 border border-white/10 inline-block w-full shadow-2xl">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white mb-2 drop-shadow-xl leading-tight">
                            {t.home.heroTitle}
                        </h1>
                        <p className="text-[9px] md:text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-6 md:mb-8 drop-shadow-md">
                            {t.home.heroDesc}
                        </p>
                        <Link to="/products" className="inline-block bg-white text-black px-10 py-3 md:py-4 md:px-12 text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-xl">
                            {t.home.heroBtn}
                        </Link>
                    </div>
                </div>
            </section>

            {/* NEW COLLECTION SECTION (As requested by user screenshot) */}
            <section className="bg-white py-12 px-4 md:px-10">
                <div className="max-w-[1400px] mx-auto bg-white shadow-[0_15px_60px_-15px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[500px]">
                    {/* Left Banner */}
                    <div className="md:w-1/3 relative h-[300px] md:h-auto overflow-hidden group">
                        <img 
                            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80" 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                            alt="Nouvelle Collection" 
                        />
                        <div className="absolute inset-0 bg-black/40 p-8 flex flex-col justify-start">
                            <span className="text-white text-lg font-medium opacity-90 drop-shadow-md">{language === 'ar' ? 'جديد' : 'Nouvelle'}</span>
                            <h2 className="text-white text-5xl font-black uppercase tracking-tight drop-shadow-xl -mt-2">Collection</h2>
                        </div>
                    </div>

                    {/* Right Carousel Area */}
                    <div className="md:w-2/3 relative flex items-center bg-white p-4">
                        <div 
                            ref={scrollRef}
                            className="flex gap-4 overflow-x-auto w-full px-6 scrollbar-hide scroll-smooth"
                        >
                            {products.slice(0, 10).map((p) => (
                                <div key={p.documentId} className="w-[200px] md:w-[280px] shrink-0">
                                    <ProductCard product={p} />
                                </div>
                            ))}
                        </div>

                        {/* Navigation Arrows (Functional now) */}
                        <button 
                            onClick={() => scroll('left')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-all z-20"
                        >
                            <ChevronLeft className="h-6 w-6 text-black" />
                        </button>
                        <button 
                            onClick={() => scroll('right')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-all z-20"
                        >
                            <ChevronRight className="h-6 w-6 text-black" />
                        </button>
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
                            t.categories.HOMME,
                            'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=1600&h=800&fit=crop',
                            hommeProducts
                        )}
                        {renderCategory(
                            t.categories.FEMME,
                            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1600&h=800&fit=crop',
                            femmeProducts
                        )}
                        {renderCategory(
                            t.categories.ENFANTS,
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
                                <h3 className="text-[13px] font-black">{t.home.guarantees.freeShipping}</h3>
                                <p className="text-[12px] text-gray-500 mt-0.5">{t.home.guarantees.freeShippingDesc}</p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex items-center gap-4 pt-6 sm:pt-0 sm:px-4 lg:px-8">
                            <CreditCard className="h-8 w-8 text-black shrink-0" strokeWidth={1.5} />
                            <div>
                                <h3 className="text-[13px] font-black">{t.home.guarantees.securePayment}</h3>
                                <p className="text-[12px] text-gray-500 mt-0.5">{t.home.guarantees.securePaymentDesc}</p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex items-center gap-4 pt-6 sm:pt-0 sm:px-4 lg:px-8">
                            <MessageSquare className="h-8 w-8 text-black shrink-0" strokeWidth={1.5} />
                            <div>
                                <h3 className="text-[13px] font-black">{t.home.guarantees.satisfaction}</h3>
                                <p className="text-[12px] text-gray-500 mt-0.5">{t.home.guarantees.satisfactionDesc}</p>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="flex items-center gap-4 pt-6 sm:pt-0 sm:px-4 lg:px-8">
                            <Truck className="h-8 w-8 text-black shrink-0" strokeWidth={1.5} />
                            <div>
                                <h3 className="text-[13px] font-black">{t.home.guarantees.fastDelivery}</h3>
                                <p className="text-[12px] text-gray-500 mt-0.5">{t.home.guarantees.fastDeliveryDesc}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
