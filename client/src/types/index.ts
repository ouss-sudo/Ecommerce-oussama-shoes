export interface StrapiImage {
    id: number;
    documentId: string;
    url: string;
    alternativeText: string | null;
    caption: string | null;
    width: number;
    height: number;
    formats: {
        thumbnail: { url: string };
        small?: { url: string };
        medium?: { url: string };
        large?: { url: string };
    };
}

export interface SeoComponent {
    id: number;
    metaTitle: string;
    metaDescription: string;
    metaImage?: StrapiImage;
    keywords?: string;
    metaRobots?: string;
    canonicalURL?: string;
    metaViewport?: string;
    structuredData?: any;
}

export interface TryOnSettings {
    scale?: number;
    offsetX?: number;
    offsetY?: number;
    rotation?: number;       // Base rotation adjustment
    flipX?: boolean;         // Mirror overlay if needed
    opacity?: number;
    default_foot?: 'left' | 'right';
}

export interface Category {
    id: number;
    documentId: string;
    name: string;
    slug: string;
    description?: string;
    image?: StrapiImage;
    cover?: StrapiImage;
}

export interface Brand {
    id: number;
    documentId: string;
    name: string;
    slug: string;
    logo?: StrapiImage;
}

export interface Variant {
    id: number;
    documentId: string;
    name: string;
    size?: string;
    color?: string;
    price_modifier?: number;
    stock?: number;
    size_link?: { name: string };
    color_link?: { name: string };
}

export interface Product {
    id: number;
    documentId: string;
    name: string;
    slug: string | null;
    description: string;
    price_display?: string;
    old_price?: string;
    active?: boolean;
    colors?: { colors: string[] } | string[] | string | null;
    sizes?: { sizes: string[] } | string[] | string | null;
    image?: StrapiImage[];
    cover?: StrapiImage;
    gallery?: StrapiImage[];
    model3D?: StrapiImage;
    tryon_overlay?: StrapiImage;
    tryon_settings?: TryOnSettings;
    categories?: Category[];
    brand?: Brand;
    variants?: Variant[];
    stock?: number;
    seo?: SeoComponent;
    createdAt: string;
    updatedAt: string;
}

export interface ContactRequest {
    id: number;
    documentId: string;
    name: string;
    email: string;
    subject: string;
    message: string;
}

export interface FlashSale {
    id: number;
    documentId: string;
    title: string;
    description: string;
    isActive: boolean;
    startAt?: string;
    endAt: string;
    discountPercentage: number;
}

export interface BannerConfig {
    id: number;
    documentId: string;
    allProductsBanner?: StrapiImage;
    promotionsBanner?: StrapiImage;
    newArrivalsBanner?: StrapiImage;
    announcementText?: string;
    showAnnouncement?: boolean;
}

export interface Page {
    id: number;
    documentId: string;
    title: string;
    slug: string;
    content: string; // Rich text or dynamic zone
    seo?: SeoComponent;
}

export interface StrapiResponse<T> {
    data: T[];
    meta: {
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    };
}

export interface StrapiSingleResponse<T> {
    data: T;
    meta?: {};
}
