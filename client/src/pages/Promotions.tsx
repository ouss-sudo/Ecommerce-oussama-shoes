import { useQuery } from "@tanstack/react-query";
import { api, getStrapiMedia } from "../lib/api";
import type { Product, StrapiResponse, BannerConfig, StrapiSingleResponse } from "../types";
import { ProductCard } from "../components/ProductCard";
import { ProductFilters } from "../components/ProductFilters";
import { Loader2, TicketPercent, X, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useState } from "react";

export default function Promotions() {
    const { t, language, dir } = useLanguage();
    
    // Filtering & Sorting states
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [sortBy, setSortBy] = useState<string>("createdAt:desc");
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

    // Fetch products in promotion
    const { data: productsData, isLoading: isProductsLoading } = useQuery({
        queryKey: ["promotions-products"],
        queryFn: async () => {
            const res = await api.get<StrapiResponse<Product>>("/products?populate[0]=cover&populate[1]=image&populate[2]=gallery&populate[3]=categories&filters[old_price][$notNull]=true&pagination[limit]=100");
            return res.data.data;
        },
    });

    // Fetch banner config
    const { data: bannerConfigData } = useQuery({
        queryKey: ["banner-config"],
        queryFn: async () => {
            const res = await api.get<StrapiSingleResponse<BannerConfig>>("/banner-config?populate=*");
            return res.data;
        },
    });

    const bannerConfig = bannerConfigData?.data;
    const bannerUrl = bannerConfig?.promotionsBanner?.url 
        ? getStrapiMedia(bannerConfig.promotionsBanner.url)! 
        : "/sale_collection_banner.png";

    const allProducts = productsData || [];

    // Client-side filtering logic
    const filteredProducts = allProducts.filter(product => {
        // 1. Size Filter
        if (selectedSizes.length > 0) {
            let productSizes: string[] = [];
            if (Array.isArray(product.sizes)) {
                productSizes = product.sizes.map(String);
            } else if (product.sizes && typeof product.sizes === 'object' && 'sizes' in product.sizes) {
                productSizes = (product.sizes as { sizes: any[] }).sizes.map(String);
            }
            if (!selectedSizes.some(s => productSizes.includes(s))) return false;
        }

        // 2. Color Filter
        if (selectedColors.length > 0) {
            let productColors: string[] = [];
            if (Array.isArray(product.colors)) {
                productColors = product.colors.map(c => String(c).toLowerCase());
            } else if (product.colors && typeof product.colors === 'object' && 'colors' in product.colors) {
                productColors = (product.colors as { colors: any[] }).colors.map(c => String(c).toLowerCase());
            }
            if (!selectedColors.some(c => productColors.includes(c.toLowerCase()))) return false;
        }

        // 3. Type Filter
        if (selectedTypes.length > 0) {
            const nameLower = product.name.toLowerCase();
            const descLower = product.description?.toLowerCase() || "";
            const hasMatch = selectedTypes.some(type => {
                if (type === 'basket') return nameLower.includes('basket') || nameLower.includes('sneak') || descLower.includes('basket') || descLower.includes('sneak');
                if (type === 'ballerine') return nameLower.includes('ballerine') || descLower.includes('ballerine');
                if (type === 'sandale') return nameLower.includes('sandale') || nameLower.includes('cendel') || descLower.includes('sandale') || descLower.includes('cendel');
                if (type === 'claquette') return nameLower.includes('claquette') || descLower.includes('claquette');
                if (type === 'talon') return nameLower.includes('talon') || nameLower.includes('heel') || descLower.includes('talon') || descLower.includes('heel');
                if (type === 'boot') return nameLower.includes('boot') || nameLower.includes('botte') || descLower.includes('boot') || descLower.includes('botte');
                return false;
            });
            if (!hasMatch) return false;
        }

        // 4. Price Filter
        const priceNum = parseFloat(String(product.price_display).replace(',', '.') || "0");
        if (priceNum < priceRange[0] || priceNum > priceRange[1]) return false;

        return true;
    });

    // Sorting
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        const priceA = parseInt(a.price_display?.replace(/\D/g, '') || "0");
        const priceB = parseInt(b.price_display?.replace(/\D/g, '') || "0");
        if (sortBy === "price:asc") return priceA - priceB;
        if (sortBy === "price:desc") return priceB - priceA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const toggleSize = (size: string) => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    const toggleColor = (color: string) => setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
    const toggleType = (type: string) => setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    const clearAllFilters = () => {
        setSelectedSizes([]);
        setSelectedColors([]);
        setSelectedTypes([]);
        setPriceRange([0, 1000]);
        setSortBy("createdAt:desc");
    };

    if (isProductsLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-black" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Premium Header Banner */}
            <div className="relative w-full h-[300px] md:h-[450px] overflow-hidden group">
                <img src={bannerUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-10000 group-hover:scale-110" alt="Promotions Banner" />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 animate-pulse">
                        <TicketPercent className="h-3 w-3" />
                        {language === 'ar' ? 'عروض خاصة' : 'Offres Spéciales'}
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-6 drop-shadow-2xl">{t.promotions.title}</h1>
                    <p className="max-w-xl text-gray-200 text-sm md:text-base font-medium opacity-90 mb-8">{t.promotions.subtitle}</p>
                    
                    <button
                        onClick={() => setIsFilterSidebarOpen(true)}
                        className="flex items-center gap-4 bg-white text-black px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300 shadow-2xl"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        {t.products.filter}
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-6 py-16">
                <div className="flex gap-12">
                    {/* Sidebar Drawer */}
                    <aside className={`fixed inset-y-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} z-[100] w-full sm:w-[450px] bg-white transform transition-transform duration-500 ease-in-out ${isFilterSidebarOpen ? "translate-x-0" : (dir === 'rtl' ? "-translate-x-full" : "translate-x-full")} shadow-2xl`}>
                        <div className="h-full relative overflow-y-auto">
                            <button onClick={() => setIsFilterSidebarOpen(false)} className={`absolute top-8 ${dir === 'rtl' ? 'left-8' : 'right-8'} z-20 p-2 hover:bg-gray-50 rounded-full transition-colors border border-gray-100`}><X className="h-6 w-6" /></button>
                            <ProductFilters
                                selectedCategory="all"
                                selectedSizes={selectedSizes}
                                onSizeChange={toggleSize}
                                selectedColors={selectedColors}
                                onColorChange={toggleColor}
                                selectedTypes={selectedTypes}
                                onTypeChange={toggleType}
                                priceRange={priceRange}
                                onPriceChange={setPriceRange}
                                sortBy={sortBy}
                                onSortChange={setSortBy}
                                onClearAll={clearAllFilters}
                                itemCount={sortedProducts.length}
                                onApply={() => setIsFilterSidebarOpen(false)}
                            />
                        </div>
                    </aside>

                    {isFilterSidebarOpen && <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-[90] animate-in fade-in duration-500" onClick={() => setIsFilterSidebarOpen(false)} />}

                    {/* Products Grid */}
                    <main className="flex-1">
                        {sortedProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center bg-gray-50 rounded-3xl">
                                <LayoutGrid className="h-16 w-16 text-gray-200" />
                                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">{t.promotions.noPromo}</p>
                                <button onClick={clearAllFilters} className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-8 py-3 hover:bg-gray-800 transition-colors">{t.products.reset}</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                                {sortedProducts.map((p) => (
                                    <ProductCard key={p.documentId} product={p} />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
