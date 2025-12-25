import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, Clock, AlertTriangle, ShieldCheck, Navigation } from 'lucide-react';
import { BloodRequest } from '../types';

interface EmergencyMapProps {
  language: 'en' | 'bn';
}

declare const L: any; // Leaflet global

const EmergencyMap: React.FC<EmergencyMapProps> = ({ language }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersLayer = useRef<any>(null);

  const [requests] = useState<BloodRequest[]>([
    {
      id: '1',
      hospitalName: 'Dhaka Medical College Hospital',
      bloodGroup: 'B+',
      unitsNeeded: 2,
      urgency: 'EMERGENCY',
      location: { lat: 23.7259, lng: 90.3973, address: 'Bakshibazar, Dhaka' },
      contactPhone: '01712345678',
      status: 'OPEN',
      timestamp: '10 mins ago'
    },
    {
      id: '2',
      hospitalName: 'Apollo Imperial Hospital',
      bloodGroup: 'A-',
      unitsNeeded: 1,
      urgency: 'EMERGENCY',
      location: { lat: 22.3475, lng: 91.8123, address: 'Zakaria, Chittagong' },
      contactPhone: '01812345678',
      status: 'OPEN',
      timestamp: '25 mins ago',
      isThalassemiaPatient: true
    },
    {
      id: '3',
      hospitalName: 'Square Hospital',
      bloodGroup: 'O+',
      unitsNeeded: 3,
      urgency: 'NORMAL',
      location: { lat: 23.7516, lng: 90.3835, address: 'West Panthapath, Dhaka' },
      contactPhone: '01912345678',
      status: 'OPEN',
      timestamp: '1 hour ago'
    }
  ]);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // Initialize map
    leafletMap.current = L.map(mapRef.current).setView([23.8103, 90.4125], 7);

    // Add CartoDB Voyager tiles (clean, light style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(leafletMap.current);

    markersLayer.current = L.layerGroup().addTo(leafletMap.current);

    // Initial marker rendering
    renderMarkers();

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  const renderMarkers = () => {
    if (!markersLayer.current) return;
    markersLayer.current.clearLayers();

    requests.forEach(req => {
      const iconClass = req.urgency === 'EMERGENCY' ? 'urgent-marker' : 'normal-marker';
      
      const customIcon = L.divIcon({
        className: iconClass,
        html: `<div style="width: 14px; height: 14px;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([req.location.lat, req.location.lng], { icon: customIcon })
        .bindPopup(`
          <div class="p-2">
            <h4 class="font-black text-gray-900">${req.hospitalName}</h4>
            <p class="text-xs font-bold text-red-600 mb-2">${req.bloodGroup} Needed: ${req.unitsNeeded} Units</p>
            <p class="text-[10px] text-gray-500">${req.location.address}</p>
          </div>
        `);
      
      markersLayer.current.addLayer(marker);
    });
  };

  const focusOnRequest = (lat: number, lng: number) => {
    if (leafletMap.current) {
      leafletMap.current.flyTo([lat, lng], 14, { duration: 1.5 });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-10rem)]">
      <div className="lg:col-span-2 bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-red-100/30 border border-gray-100 relative">
        <div ref={mapRef} className="absolute inset-0 z-0"></div>
        
        {/* Map UI Overlays */}
        <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">
                {language === 'en' ? 'Emergency' : 'জরুরী'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">
                {language === 'en' ? 'Normal' : 'সাধারণ'}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => leafletMap.current.setView([23.8103, 90.4125], 7)}
          className="absolute top-6 right-6 z-10 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 hover:bg-gray-50 transition-all active:scale-95"
        >
          <Navigation size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        <div className="sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10 py-2 mb-2">
           <h3 className="font-black text-gray-900 text-xl tracking-tight">
            {language === 'en' ? 'Live Requests Nearby' : 'নিকটস্থ লাইভ রিকোয়েস্ট'}
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {requests.length} {language === 'en' ? 'Requests Found' : 'অনুরোধ পাওয়া গেছে'}
          </p>
        </div>
        
        {requests.map((req) => (
          <div 
            key={req.id} 
            onClick={() => focusOnRequest(req.location.lat, req.location.lng)}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
                req.urgency === 'EMERGENCY' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}>
                {req.urgency === 'EMERGENCY' ? (language === 'en' ? 'EMERGENCY' : 'জরুরী') : (language === 'en' ? 'NORMAL' : 'সাধারণ')}
              </span>
              <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase">
                <Clock size={12} /> {req.timestamp}
              </span>
            </div>
            
            <div className="flex items-center gap-4 mb-5">
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 ${
                req.urgency === 'EMERGENCY' ? 'bg-red-600 text-white border-red-700' : 'bg-blue-600 text-white border-blue-700'
              } shadow-lg transition-transform group-hover:scale-110`}>
                <span className="text-xl font-black leading-none">{req.bloodGroup}</span>
                <span className="text-[8px] font-black uppercase mt-1">{req.unitsNeeded}U</span>
              </div>
              <div>
                <h4 className="font-black text-gray-900 leading-tight group-hover:text-red-600 transition-colors">{req.hospitalName}</h4>
                <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-1">
                  <MapPin size={12} className="text-red-500" /> {req.location.address}
                </p>
              </div>
            </div>

            {req.isThalassemiaPatient && (
              <div className="bg-purple-50 p-3 rounded-xl flex items-center gap-2 mb-5 text-purple-700 text-xs font-black border border-purple-100">
                <ShieldCheck size={16} /> {language === 'en' ? 'THALASSEMIA SUPPORT' : 'থ্যালাসেমিয়া সহায়তা'}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl text-xs font-black hover:bg-black transition-all active:scale-95 uppercase tracking-widest">
                {language === 'en' ? 'Accept' : 'গ্রহণ'}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); window.location.href=`tel:${req.contactPhone}`; }}
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-900 py-3 rounded-xl text-xs font-black hover:bg-gray-50 transition-all active:scale-95 uppercase tracking-widest"
              >
                <Phone size={14} /> {language === 'en' ? 'Call' : 'কল'}
              </button>
            </div>
          </div>
        ))}

        <div className="bg-red-50 p-5 rounded-[2rem] border border-red-100 flex items-start gap-4">
          <div className="p-2 bg-red-600 rounded-lg text-white">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-red-900 uppercase mb-1">{language === 'en' ? 'Donor Safety Notice' : 'রক্তদাতা সুরক্ষা নোটিশ'}</p>
            <p className="text-[10px] text-red-800 leading-relaxed font-bold">
              {language === 'en' 
                ? 'Accepting a request notifies the hospital. Ensure you haven\'t donated in the last 120 days.' 
                : 'অনুরোধ গ্রহণ করলে হাসপাতাল জানতে পারবে। নিশ্চিত করুন যে আপনি গত ১২০ দিনে রক্ত দেননি।'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyMap;