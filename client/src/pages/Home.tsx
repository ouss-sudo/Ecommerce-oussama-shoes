import { useQuery } from "@tanstack/react-query";
import { api, getStrapiMedia } from "../lib/api";
import type { Product, StrapiResponse } from "../types";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Home() {
    const { t, dir } = useLanguage();
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


            {/* Featured Categories / Products Grid */}
            <section className="container mx-auto px-4 py-16 bg-white">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter border-b-8 border-black inline-block pb-2">{t.home.essentials}</h2>
                </div>
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-black" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex justify-center py-20 text-gray-400 font-bold uppercase tracking-widest text-xs">
                        {t.home.noFeatured}
                    </div>
                ) : (
                    <div className="relative w-full overflow-hidden group bg-white py-4">
                        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                        <div className="flex gap-6 animate-marquee w-max">
                            {[...products, ...products, ...products].map((product, index) => {
                                const link = product.slug ? `/products/${product.slug}` : `/products/${product.documentId}`;
                                const image = product.cover?.url || product.image?.[0]?.url || "";
                                return (
                                    <Link
                                        to={link}
                                        key={`${product.id}-${index}`}
                                        className="relative w-[280px] h-[380px] flex-shrink-0 overflow-hidden bg-gray-50 border-2 border-transparent hover:border-black group/item transition-all"
                                    >
                                        {image ? (
                                            <img
                                                src={getStrapiMedia(image) || ""}
                                                alt={product.name}
                                                className="h-full w-full object-cover transition-transform duration-1000 group-hover/item:scale-110"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-300 bg-gray-50">
                                                <span className="text-xs uppercase font-bold">No Image</span>
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/5 transition-colors duration-300" />

                                        <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 group-hover/item:translate-y-0 group-hover/item:opacity-100 transition-all duration-500">
                                            <span className="inline-block w-full text-center bg-black text-white text-[10px] font-black uppercase tracking-widest px-4 py-4 shadow-2xl">
                                                {product.name}
                                            </span>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>

                        <style>{`
                            @keyframes marquee {
                                0% { transform: translateX(0); }
                                100% { transform: translateX(-33.33%); }
                            }
                            .animate-marquee {
                                animation: marquee 30s linear infinite;
                            }
                            .group:hover .animate-marquee {
                                animation-play-state: paused;
                            }
                        `}</style>
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

        </div>
    );
}
