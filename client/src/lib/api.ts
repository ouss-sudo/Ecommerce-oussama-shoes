import axios from "axios";

export const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || "http://localhost:1337";

export const api = axios.create({
    baseURL: `${STRAPI_URL}/api`,
});

// Security: Attach JWT token automatically to all requests if present
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getStrapiURL = (path = "") => {
    return `${STRAPI_URL}${path}`;
};

export const getStrapiMedia = (media: any, format?: 'thumbnail' | 'small' | 'medium' | 'large') => {
    if (!media) return null;

    // If it's just a URL string (old approach)
    if (typeof media === 'string') {
        if (media.startsWith("http") || media.startsWith("//")) return media;
        return `${STRAPI_URL}${media}`;
    }

    // If it's a Strapi media object with formats
    if (format && media.formats?.[format]?.url) {
        return `${STRAPI_URL}${media.formats[format].url}`;
    }

    // Fallback to original URL
    const url = media.url;
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("//")) return url;
    return `${STRAPI_URL}${url}`;
};
