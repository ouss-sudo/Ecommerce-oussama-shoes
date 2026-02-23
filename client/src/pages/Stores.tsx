import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { MapPin } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const stores = [
    {
        id: 1,
        name: "Oussama Shoes - Kelibia",
        position: [36.8460, 11.0915],
        address: "8090 Avenue du Hammadi Gharbi, Kelibia",
        phone: "+216 22 616 088",
        hours: "9h - 21h (7j/7)",
        mapLink: "https://maps.app.goo.gl/kmDScJPyEhvueG6C9"
    },
    {
        id: 2,
        name: "Oussama Shoes - Nabeul",
        position: [36.4445, 10.7812], // Approximating Beni Khiar coordinate for better map accuracy if possible, but keeping original or refining. 
        address: "Route beni Khiar-Nabeul (Près Maison Hyundai)",
        phone: "+216 22 616 088",
        hours: "9h - 21h (7j/7)",
        mapLink: "https://maps.app.goo.gl/MwQCbCryxAGPxGHL9"
    },
];

export default function Stores() {
    const { t, dir } = useLanguage();

    return (
        <div className="flex flex-col w-full min-h-screen bg-white">
            <div className="container px-4 md:px-6 py-12 md:py-24">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">{t.stores.title}</h1>
                        <p className="max-w-[700px] text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mx-auto">
                            {t.stores.subtitle}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20 max-w-5xl mx-auto">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-gray-50 p-10 border border-gray-100 hover:border-black transition-all group">
                            <h3 className="font-black text-2xl uppercase mb-6 tracking-tight">{store.name}</h3>
                            <div className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                <p className={`flex items-start ${dir === 'rtl' ? 'flex-row-reverse text-right' : ''}`}>
                                    <MapPin className={`h-4 w-4 ${dir === 'rtl' ? 'ml-3' : 'mr-3'} text-black shrink-0`} />
                                    {store.address}
                                </p>
                                <p className={`${dir === 'rtl' ? 'text-right' : ''}`}>{t.stores.phone} <span className="text-black ml-1">{store.phone}</span></p>
                                <p className={`${dir === 'rtl' ? 'text-right' : ''}`}>{t.stores.hours} <span className="text-black ml-1">{store.hours}</span></p>
                                <a
                                    href={store.mapLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center text-black border-b-2 border-black pb-1 hover:text-red-600 hover:border-red-600 transition-all font-black mt-6 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
                                >
                                    {t.stores.maps} {dir === 'rtl' ? '←' : '→'}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mx-auto w-full h-[600px] shadow-2xl border-4 border-black relative z-0 mb-16 grayscale hover:grayscale-0 transition-all duration-700">
                    <MapContainer
                        center={[36.65, 10.9]}
                        zoom={9}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {stores.map((store) => (
                            <Marker key={store.id} position={store.position as [number, number]}>
                                <Popup>
                                    <div className="font-sans text-center p-2">
                                        <h3 className="font-black text-xs uppercase mb-1">{store.name}</h3>
                                        <p className="text-[10px] text-gray-500 mb-2">{store.address}</p>
                                        <p className="text-[10px] font-black">{store.hours}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}
