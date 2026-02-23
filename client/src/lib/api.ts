import axios from "axios";

export const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || "http://localhost:1337";

export const api = axios.create({
    baseURL: `${STRAPI_URL}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

export const getStrapiURL = (path = "") => {
    return `${STRAPI_URL}${path}`;
};

export const getStrapiMedia = (url: string | null) => {
    if (url == null) {
        return null;
    }
    if (url.startsWith("http") || url.startsWith("//")) {
        return url;
    }
    return `${STRAPI_URL}${url}`;
};
