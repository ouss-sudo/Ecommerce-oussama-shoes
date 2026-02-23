import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { MapPin } from "lucide-react";

// Fix for default marker icon in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const stores = [
    {
        id: 1,
        name: "Oussama Shoes - Kelibia",
        position: [36.8460, 11.0915],
        address: "8090 Avenue du martyr Hammadi Gharbi, Kelibia",
        phone: "+216 22 616 088",
        hours: "9h - 20h (7j/7)",
        mapLink: "https://maps.app.goo.gl/kmDScJPyEhvueG6C9"
    },
    {
        id: 2,
        name: "Oussama Shoes - Nabeul",
        position: [36.4550, 10.7350],
        address: "Nabeul, Tunisie",
        phone: "+216 22 616 088",
        hours: "9h - 21h (7j/7)",
        mapLink: "https://maps.app.goo.gl/MwQCbCryxAGPxGHL9"
    },
];

export function StoreLocator() {
    return (
        <section className="w-full py-12 bg-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="font-bold text-xl uppercase mb-2">{store.name}</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p className="flex items-start">
                                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-black shrink-0" />
                                    {store.address}
                                </p>
                                <p className="font-medium">Tél: {store.phone}</p>
                                <p className="font-medium">Ouvert: {store.hours}</p>
                                <a
                                    href={store.mapLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold mt-2"
                                >
                                    Voir sur Google Maps &rarr;
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mx-auto w-full h-[500px] rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
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
                                    <div className="font-sans text-center min-w-[150px]">
                                        <h3 className="font-bold text-sm uppercase mb-1">{store.name}</h3>
                                        <p className="text-xs text-gray-600 mb-1">{store.address}</p>
                                        <p className="text-xs font-semibold">{store.hours}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </section>
    );
}
