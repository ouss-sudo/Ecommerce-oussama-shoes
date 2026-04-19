import { useQuery } from "@tanstack/react-query";
import { api, getStrapiMedia } from "../lib/api";
import type { Product, StrapiResponse, Category, BannerConfig, StrapiSingleResponse } from "../types";
import { ProductCard } from "../components/ProductCard";
import { ProductFilters } from "../components/ProductFilters";
import { Loader2, LayoutGrid, SlidersHorizontal, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";


export default function Products() {
    const [searchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get("category");
    const searchFromUrl = searchParams.get("search");
    const [selectedCategory, setSelectedCategory] = useState<string | "all">(categoryFromUrl || "all");
    const { t, dir } = useLanguage();

    // Filtering & Sorting states
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [sortBy, setSortBy] = useState<string>("createdAt:desc");
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

    // Sync state with URL
    useEffect(() => {
        if (categoryFromUrl) {
            setSelectedCategory(categoryFromUrl);
        } else {
            setSelectedCategory("all");
        }
    }, [categoryFromUrl]);

    // Fetch all products
    const { data: productsData, isLoading } = useQuery({
        queryKey: ["all-products"],
        queryFn: async () => {
            const res = await api.get<StrapiResponse<Product>>(
                "/products?fields[0]=name&fields[1]=price_display&fields[2]=slug&fields[3]=description&fields[4]=colors&fields[5]=sizes&populate[0]=cover&populate[1]=image&populate[2]=gallery&populate[3]=categories&pagination[limit]=100&sort=createdAt:desc"
            );
            return res.data;
        },
        placeholderData: (previousData) => previousData, // Prevents products from disappearing while refetching
        refetchInterval: 60000, // Sync every minute
    });

    // Fetch categories with covers
    const { data: categoriesData } = useQuery({
        queryKey: ["categories-all"],
        queryFn: async () => {
            const res = await api.get<StrapiResponse<Category>>("/categories?populate=*");
            return res.data;
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

    const categories = categoriesData?.data || [];
    const bannerConfig = bannerConfigData?.data;

    const allFetchedProducts = productsData?.data || [];

    // Client-side filtering logic
    const filteredProducts = allFetchedProducts.filter(product => {
        // 1. Category Filter
        if (selectedCategory !== "all") {
            const hasCategory = product.categories?.some(cat => 
                cat.name?.toLowerCase() === selectedCategory.toLowerCase()
            );
            if (!hasCategory) return false;
        }

        // 2. Search Filter
        if (searchFromUrl) {
            const searchLower = searchFromUrl.toLowerCase();
            const matchesSearch = product.name.toLowerCase().includes(searchLower) ||
                product.description?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }

        // 3. Size Filter
        if (selectedSizes.length > 0) {
            // Normalise les tailles du produit (JSON)
            let productSizes: string[] = [];
            if (Array.isArray(product.sizes)) {
                productSizes = product.sizes.map(String);
            } else if (product.sizes && typeof product.sizes === 'object' && 'sizes' in product.sizes) {
                productSizes = (product.sizes as { sizes: any[] }).sizes.map(String);
            }

            const hasMatch = selectedSizes.some(s => productSizes.includes(s));
            if (!hasMatch) return false;
        }

        // 4. Color Filter
        if (selectedColors.length > 0) {
            // Normalise les couleurs du produit (JSON)
            let productColors: string[] = [];
            if (Array.isArray(product.colors)) {
                productColors = product.colors.map(c => String(c).toLowerCase());
            } else if (product.colors && typeof product.colors === 'object' && 'colors' in product.colors) {
                productColors = (product.colors as { colors: any[] }).colors.map(c => String(c).toLowerCase());
            }

            const hasMatch = selectedColors.some(c => productColors.includes(c.toLowerCase()));
            if (!hasMatch) return false;
        }

        // 5. Product Type Filter (Basket, Ballerine, etc.)
        if (selectedTypes.length > 0) {
            const nameLower = product.name.toLowerCase();
            const descLower = product.description?.toLowerCase() || "";

            const hasMatch = selectedTypes.some(type => {
                if (type === 'basket') return nameLower.includes('basket') || nameLower.includes('sneak') || descLower.includes('basket') || descLower.includes('sneak');
                if (type === 'ballerine') return nameLower.includes('ballerine') || descLower.includes('ballerine');
                if (type === 'sandale') return nameLower.includes('sandale') || nameLower.includes('cendel') || descLower.includes('sandale') || descLower.includes('cendel');
                if (type === 'claquette') return nameLower.includes('claquette') || descLower.includes('claquette');
                if (type === 'talon') return nameLower.includes('talon') || nameLower.includes('heel') || descLower.includes('talon') || descLower.includes('heel');
                if (type === 'talon-soiree') return (nameLower.includes('talon') && nameLower.includes('soir')) || (descLower.includes('talon') && descLower.includes('soir'));
                if (type === 'boot') return nameLower.includes('boot') || nameLower.includes('botte') || descLower.includes('boot') || descLower.includes('botte');
                if (type === 'chaussures') return nameLower.includes('chaussure') || nameLower.includes('classic') || descLower.includes('chaussure') || descLower.includes('classic');
                return false;
            });

            if (!hasMatch) return false;
        }

        // 6. Price Filter
        // 6. Price Filter
        const priceNum = parseFloat(String(product.price_display).replace(',', '.') || "0");
        if (priceNum < priceRange[0] || priceNum > priceRange[1]) return false;

        return true;
    });

    // Client-side sorting
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === "price:asc") {
            const priceA = parseInt(a.price_display?.replace(/\D/g, '') || "0");
            const priceB = parseInt(b.price_display?.replace(/\D/g, '') || "0");
            return priceA - priceB;
        }
        if (sortBy === "price:desc") {
            const priceA = parseInt(a.price_display?.replace(/\D/g, '') || "0");
            const priceB = parseInt(b.price_display?.replace(/\D/g, '') || "0");
            return priceB - priceA;
        }
        if (sortBy === "createdAt:desc") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
    });

    const products = sortedProducts;

    const toggleSize = (size: string) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const toggleColor = (color: string) => {
        setSelectedColors(prev =>
            prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
        );
    };

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const clearAllFilters = () => {
        setSelectedSizes([]);
        setSelectedColors([]);
        setSelectedTypes([]);
        setPriceRange([0, 1000]);
        setSortBy("createdAt:desc");
    };

    const handleApply = () => {
        setIsFilterSidebarOpen(false);
    };

    return (
        <div className="relative overflow-x-hidden">
            {/* Premium Header Banner */}
            <div className="relative w-full h-[300px] md:h-[450px] mb-12 -mt-8 overflow-hidden group">
                {/* Background Image with slight zoom effect */}
                {(() => {
                    let bannerUrl = "/shoe_collection_banner.png"; // Default global fallback
                    
                    if (selectedCategory === "all") {
                        if (bannerConfig?.allProductsBanner?.url) {
                            bannerUrl = getStrapiMedia(bannerConfig.allProductsBanner.url)!;
                        }
                    } else if (selectedCategory === "NOUVEAUTÉS") {
                        bannerUrl = "/new_banner.png"; // Specific fallback
                        if (bannerConfig?.newArrivalsBanner?.url) {
                            bannerUrl = getStrapiMedia(bannerConfig.newArrivalsBanner.url)!;
                        }
                    } else if (selectedCategory === "HOMME") {
                        bannerUrl = "/men_banner.png";
                    } else if (selectedCategory === "FEMME") {
                        bannerUrl = "/women_banner.png";
                    } else if (selectedCategory === "ENFANTS" || selectedCategory === "ENFANT") {
                        bannerUrl = "/kids_banner.png";
                    }

                    // Always check if Strapi has an override for Categories
                    if (selectedCategory !== "all" && selectedCategory !== "NOUVEAUTÉS") {
                        const currentCat = categories.find(c => c.name === selectedCategory);
                        if (currentCat?.cover?.url) {
                            bannerUrl = getStrapiMedia(currentCat.cover.url)!;
                        } else if (currentCat?.image?.url) {
                            bannerUrl = getStrapiMedia(currentCat.image.url)!;
                        }
                    }

                    return (
                        <img 
                            src={bannerUrl} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-10000 group-hover:scale-110" 
                            alt="Banner"
                        />
                    );
                })()}
                
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-colors duration-500 group-hover:bg-black/50" />
                
                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[9px] font-black text-white uppercase tracking-[0.3em] mb-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                        {products.length} {t.products.found}
                    </div>
                    
                    <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-8 drop-shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {selectedCategory === "all" ? t.products.title : (t.categories[selectedCategory as keyof typeof t.categories] || selectedCategory)}
                    </h1>

                    <button
                        onClick={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)}
                        className="flex items-center gap-4 bg-white text-black px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300 shadow-2xl active:scale-95 animate-in fade-in slide-in-from-bottom-6 duration-1000"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        {isFilterSidebarOpen ? t.products.close : t.products.filter}
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 md:py-16">
                <div className="flex gap-12">
                    {/* Sidebar Drawer */}
                    <aside
                        className={`fixed inset-y-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} z-[100] w-full sm:w-[450px] bg-white transform transition-transform duration-500 ease-in-out ${isFilterSidebarOpen ? "translate-x-0" : (dir === 'rtl' ? "-translate-x-full" : "translate-x-full")
                            } shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)]`}
                    >
                        <div className="h-full relative overflow-y-auto">
                            <button
                                onClick={() => setIsFilterSidebarOpen(false)}
                                className={`absolute top-8 ${dir === 'rtl' ? 'left-8' : 'right-8'} z-20 p-2 hover:bg-gray-50 rounded-full transition-colors border border-gray-100`}
                            >
                                <X className="h-6 w-6" />
                            </button>
                            <ProductFilters
                                selectedCategory={selectedCategory}
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
                                itemCount={products.length}
                                onApply={handleApply}
                            />
                        </div>
                    </aside>

                    {/* Overlay */}
                    {isFilterSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-white/60 backdrop-blur-md z-[90] animate-in fade-in duration-500"
                            onClick={() => setIsFilterSidebarOpen(false)}
                        />
                    )}

                    {/* Main Content */}
                    <div className="flex-1 px-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-black" />
                                <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">{t.products.loading}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                {products.length > 0 ? (
                                    products.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))
                                ) : (
                                    <div className="col-span-full flex flex-col items-center justify-center py-40 text-center gap-8 bg-gray-50/50 rounded-3xl">
                                        <LayoutGrid className="h-20 w-20 text-gray-100" />
                                        <div>
                                            <p className="text-2xl font-black uppercase tracking-tighter mb-2">{t.products.noResult}</p>
                                        </div>
                                        <button
                                            onClick={clearAllFilters}
                                            className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-10 py-4 hover:bg-gray-800 transition-colors"
                                        >
                                            {t.products.reset}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
