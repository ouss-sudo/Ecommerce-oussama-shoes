import { X, MapPin, Store } from "lucide-react";

interface DeliveryInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DeliveryInfoModal({ isOpen, onClose }: DeliveryInfoModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200 border border-gray-100 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="text-center space-y-4 mb-6">
                    <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Store className="h-8 w-8 text-black" />
                    </div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
                        Information Livraison
                    </h2>
                    <p className="text-red-500 font-medium bg-red-50 py-2 px-4 rounded-full inline-block text-sm">
                        La livraison n'est pas disponible pour le moment.
                    </p>
                    <p className="text-gray-600">
                        Nous serons ravis de vous accueillir directement dans nos boutiques pour effectuer vos achats.
                    </p>
                </div>

                <div className="space-y-4 bg-gray-50 p-5 rounded-lg border border-gray-100">
                    <h3 className="font-bold text-sm uppercase text-gray-900 mb-3 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Nos Adresses
                    </h3>

                    <div className="space-y-3">
                        <div className="bg-white p-3 rounded border border-gray-200 shadow-sm relative group hover:border-black transition-colors">
                            <p className="font-bold text-sm text-black">Oussama Shoes - Kelibia</p>
                            <p className="text-xs text-gray-500 mt-1">8090 Avenue du martyr Hammadi Gharbi, Kelibia</p>
                            <a
                                href="https://maps.app.goo.gl/kmDScJPyEhvueG6C9"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center mt-2 text-xs font-bold text-blue-600 hover:underline uppercase tracking-wide"
                            >
                                <MapPin className="h-3 w-3 mr-1" />
                                Voir sur la carte
                            </a>
                        </div>

                        <div className="bg-white p-3 rounded border border-gray-200 shadow-sm relative group hover:border-black transition-colors">
                            <p className="font-bold text-sm text-black">Oussama Shoes - Nabeul</p>
                            <p className="text-xs text-gray-500 mt-1">Route Beni Khiar-Nabeul (Près Maison Hyundai)</p>
                            <a
                                href="https://maps.app.goo.gl/MwQCbCryxAGPxGHL9"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center mt-2 text-xs font-bold text-blue-600 hover:underline uppercase tracking-wide"
                            >
                                <MapPin className="h-3 w-3 mr-1" />
                                Voir sur la carte
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pb-4">
                    <button
                        onClick={onClose}
                        className="w-full bg-black text-white py-3 rounded-lg font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors shadow-lg"
                    >
                        Compris
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">
                        Oussama Shoes - Votre style, notre passion.
                    </p>
                </div>
            </div>
        </div>
    );
}
