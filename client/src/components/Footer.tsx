import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, Facebook, Instagram } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="bg-[#181818] text-white py-12 border-t border-white/5 font-sans">
            <div className="container mx-auto px-4 max-w-[1400px]">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                    {/* Contact Section */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] border-b border-white/10 pb-4 inline-block">
                            {t.footer.contact}
                        </h3>
                        <div className="space-y-4 text-xs font-bold text-gray-400">
                            <div className="flex items-start gap-3 group">
                                <MapPin className="h-4 w-4 text-white shrink-0" />
                                <div className="group-hover:text-white transition-colors">
                                    <p className="text-white">Oussama Shoes</p>
                                    <p>{t.footer.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 group">
                                <Mail className="h-4 w-4 text-white shrink-0" />
                                <a href={`mailto:${t.footer.email}`} className="group-hover:text-white transition-colors lowercase">
                                    {t.footer.email}
                                </a>
                            </div>
                            <div className="flex items-center gap-3 group">
                                <Phone className="h-4 w-4 text-white shrink-0" />
                                <a href="tel:+21654718442" className="group-hover:text-white transition-colors">
                                    {t.footer.phone}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Products Section */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] border-b border-white/10 pb-4 inline-block">
                            {t.footer.products}
                        </h3>
                        <ul className="space-y-3 text-xs font-bold text-gray-400">
                            <li>
                                <Link to="/products?category=NOUVEAUTÉS" className="hover:text-white transition-all hover:translate-x-1 inline-block">
                                    {t.footer.newProducts}
                                </Link>
                            </li>
                            <li>
                                <button className="hover:text-white transition-all hover:translate-x-1 inline-block">
                                    {t.footer.promotions}
                                </button>
                            </li>
                            <li>
                                <button className="hover:text-white transition-all hover:translate-x-1 inline-block">
                                    {t.footer.bestSellers}
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Company Section */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] border-b border-white/10 pb-4 inline-block">
                            {t.footer.company}
                        </h3>
                        <ul className="space-y-3 text-xs font-bold text-gray-400">
                            <li>
                                <Link to="/contact" className="hover:text-white transition-all hover:translate-x-1 inline-block">
                                    {t.footer.shipping}
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="hover:text-white transition-all hover:translate-x-1 inline-block">
                                    {t.footer.legal}
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="hover:text-white transition-all hover:translate-x-1 inline-block">
                                    {t.footer.terms}
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="hover:text-white transition-all hover:translate-x-1 inline-block">
                                    {t.footer.about}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Social Icons */}
                    <div className="flex items-center gap-4">
                        <a
                            href="https://www.facebook.com/p/Oussama-Shoes-100067236050549/?locale=fr_FR"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/5 p-3 rounded-full hover:bg-white hover:text-black transition-all active:scale-90"
                        >
                            <Facebook className="h-4 w-4" />
                        </a>
                        <a
                            href="https://www.instagram.com/oussamashoes/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/5 p-3 rounded-full hover:bg-white hover:text-black transition-all active:scale-90"
                        >
                            <Instagram className="h-4 w-4" />
                        </a>
                    </div>

                    {/* Copyright */}
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-center md:text-left">
                        {t.footer.copyright}
                    </p>
                </div>
            </div>
        </footer>
    );
}
