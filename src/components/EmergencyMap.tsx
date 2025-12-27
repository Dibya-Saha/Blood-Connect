import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, Clock, AlertTriangle, ShieldCheck, Navigation, ExternalLink, Navigation2 } from 'lucide-react';
import { BloodRequest } from '../types';

interface EmergencyMapProps {
  language: 'en' | 'bn';
}

declare const L: any;

const EmergencyMap: React.FC<EmergencyMapProps> = ({ language }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const routeLayer = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const hospitalMarker = useRef<any>(null);

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);

  // Fetch requests from database
  const fetchRequests = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/requests?status=OPEN`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert(language === 'en' 
            ? 'Location access denied. Please enable location services to see your position on the map.' 
            : 'অবস্থান অ্যাক্সেস অস্বীকার করা হয়েছে। মানচিত্রে আপনার অবস্থান দেখতে অনুগ্রহ করে অবস্থান পরিষেবা সক্ষম করুন।');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert(language === 'en' 
        ? 'Geolocation is not supported by your browser.' 
        : 'আপনার ব্রাউজার দ্বারা জিওলোকেশন সমর্থিত নয়।');
    }
  };

  // Update user marker when location changes
  useEffect(() => {
    if (!leafletMap.current || !userLocation) return;

    // Remove existing marker if it exists
    if (userMarker.current) {
      leafletMap.current.removeLayer(userMarker.current);
      userMarker.current = null;
    }

    // Create user location icon
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `<div style="width: 24px; height: 24px; background: #3b82f6; border: 4px solid white; border-radius: 50%; box-shadow: 0 2px 10px rgba(59, 130, 246, 0.6); animation: pulse 2s infinite;"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    // Add user marker to map
    userMarker.current = L.marker([userLocation.lat, userLocation.lng], { 
      icon: userIcon,
      zIndexOffset: 1000 // Ensure user marker is always on top
    })
      .addTo(leafletMap.current)
      .bindPopup(`<div class="p-2"><strong>${language === 'en' ? 'Your Location' : 'আপনার অবস্থান'}</strong></div>`);

    // Center map on user location if no request is selected
    if (!selectedRequest) {
      leafletMap.current.setView([userLocation.lat, userLocation.lng], 13);
    }

  }, [userLocation, language, selectedRequest]);

  useEffect(() => {
    fetchRequests();
    getUserLocation();
    
    // Refresh requests every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // Initialize map - center on user location if available, otherwise default
    const initialCenter = userLocation 
      ? [userLocation.lat, userLocation.lng] 
      : [23.8103, 90.4125];
    const initialZoom = userLocation ? 13 : 7;
    
    leafletMap.current = L.map(mapRef.current).setView(initialCenter, initialZoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(leafletMap.current);

    markersLayer.current = L.layerGroup().addTo(leafletMap.current);
    routeLayer.current = L.layerGroup().addTo(leafletMap.current);

    // If user location is already available, add marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="width: 24px; height: 24px; background: #3b82f6; border: 4px solid white; border-radius: 50%; box-shadow: 0 2px 10px rgba(59, 130, 246, 0.6); animation: pulse 2s infinite;"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      userMarker.current = L.marker([userLocation.lat, userLocation.lng], { 
        icon: userIcon,
        zIndexOffset: 1000
      })
        .addTo(leafletMap.current)
        .bindPopup(`<div class="p-2"><strong>${language === 'en' ? 'Your Location' : 'আপনার অবস্থান'}</strong></div>`);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (leafletMap.current && requests.length > 0) {
      renderMarkers();
    }
  }, [requests]);

  const renderMarkers = () => {
    if (!markersLayer.current) return;
    markersLayer.current.clearLayers();

    requests.forEach(req => {
      // Create more visible hospital markers
      const isEmergency = req.urgency === 'EMERGENCY';
      const markerColor = isEmergency ? '#dc2626' : '#2563eb';
      const markerSize = isEmergency ? 20 : 16;
      
      const customIcon = L.divIcon({
        className: 'hospital-marker',
        html: `<div style="width: ${markerSize}px; height: ${markerSize}px; background: ${markerColor}; border: 3px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;">
                 <div style="transform: rotate(45deg); position: absolute; top: 50%; left: 50%; margin-top: -${markerSize/4}px; margin-left: -${markerSize/4}px; width: ${markerSize/2}px; height: ${markerSize/2}px; background: white; border-radius: 50%;"></div>
               </div>`,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize/2, markerSize]
      });

      const marker = L.marker([req.location.lat, req.location.lng], { 
        icon: customIcon,
        zIndexOffset: isEmergency ? 500 : 100
      })
        .bindPopup(`
          <div class="p-3">
            <h4 class="font-black text-gray-900 mb-1">${req.hospitalName}</h4>
            <p class="text-xs font-bold text-red-600 mb-2">${req.bloodGroup} ${language === 'en' ? 'Needed' : 'প্রয়োজন'}: ${req.unitsNeeded} ${language === 'en' ? 'Units' : 'ইউনিট'}</p>
            <p class="text-[10px] text-gray-500 mb-2">${req.location.address}</p>
            ${userLocation ? `<p class="text-[10px] font-bold text-blue-600">${calculateDistance(userLocation.lat, userLocation.lng, req.location.lat, req.location.lng).toFixed(1)} km ${language === 'en' ? 'away' : 'দূরে'}</p>` : ''}
          </div>
        `);
      
      markersLayer.current.addLayer(marker);
    });
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const showDirections = (request: BloodRequest) => {
    if (!leafletMap.current) return;

    setSelectedRequest(request);

    // If user location is not available, try to get it
    if (!userLocation) {
      getUserLocation();
      // Still show the hospital location
      if (hospitalMarker.current) {
        leafletMap.current.removeLayer(hospitalMarker.current);
      }
      
      // Highlight selected hospital with a special marker
      const hospitalIcon = L.divIcon({
        className: 'selected-hospital-marker',
        html: `<div style="width: 30px; height: 30px; background: #dc2626; border: 4px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 15px rgba(220, 38, 38, 0.6); position: relative; animation: pulse 2s infinite;">
                 <div style="transform: rotate(45deg); position: absolute; top: 50%; left: 50%; margin-top: -8px; margin-left: -8px; width: 16px; height: 16px; background: white; border-radius: 50%;"></div>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });
      
      hospitalMarker.current = L.marker([request.location.lat, request.location.lng], { 
        icon: hospitalIcon,
        zIndexOffset: 1500
      })
        .addTo(leafletMap.current)
        .bindPopup(`
          <div class="p-3">
            <h4 class="font-black text-gray-900 mb-1">${request.hospitalName}</h4>
            <p class="text-xs font-bold text-red-600 mb-2">${request.bloodGroup} ${language === 'en' ? 'Needed' : 'প্রয়োজন'}: ${request.unitsNeeded} ${language === 'en' ? 'Units' : 'ইউনিট'}</p>
            <p class="text-[10px] text-gray-500">${request.location.address}</p>
          </div>
        `)
        .openPopup();

      // Center map on hospital
      leafletMap.current.setView([request.location.lat, request.location.lng], 14);
      
      alert(language === 'en' 
        ? 'Please enable location access to see your location and directions to the hospital' 
        : 'হাসপাতালে আপনার অবস্থান এবং দিকনির্দেশ দেখতে অনুগ্রহ করে অবস্থান অ্যাক্সেস সক্ষম করুন');
      return;
    }

    // Clear previous route and hospital marker
    if (routeLayer.current) {
      routeLayer.current.clearLayers();
    }
    if (hospitalMarker.current) {
      leafletMap.current.removeLayer(hospitalMarker.current);
    }

    // Draw line from user to hospital
    const latlngs = [
      [userLocation.lat, userLocation.lng],
      [request.location.lat, request.location.lng]
    ];

    const polyline = L.polyline(latlngs, {
      color: '#dc2626',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(routeLayer.current);

    // Highlight selected hospital with a special marker
    const hospitalIcon = L.divIcon({
      className: 'selected-hospital-marker',
      html: `<div style="width: 30px; height: 30px; background: #dc2626; border: 4px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 15px rgba(220, 38, 38, 0.6); position: relative; animation: pulse 2s infinite;">
               <div style="transform: rotate(45deg); position: absolute; top: 50%; left: 50%; margin-top: -8px; margin-left: -8px; width: 16px; height: 16px; background: white; border-radius: 50%;"></div>
             </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });
    
    hospitalMarker.current = L.marker([request.location.lat, request.location.lng], { 
      icon: hospitalIcon,
      zIndexOffset: 1500
    })
      .addTo(leafletMap.current)
      .bindPopup(`
        <div class="p-3">
          <h4 class="font-black text-gray-900 mb-1">${request.hospitalName}</h4>
          <p class="text-xs font-bold text-red-600 mb-2">${request.bloodGroup} ${language === 'en' ? 'Needed' : 'প্রয়োজন'}: ${request.unitsNeeded} ${language === 'en' ? 'Units' : 'ইউনিট'}</p>
          <p class="text-[10px] text-gray-500 mb-2">${request.location.address}</p>
          <p class="text-[10px] font-bold text-blue-600">${calculateDistance(userLocation.lat, userLocation.lng, request.location.lat, request.location.lng).toFixed(1)} km ${language === 'en' ? 'away' : 'দূরে'}</p>
        </div>
      `)
      .openPopup();

    // Ensure user marker is visible
    if (userMarker.current) {
      userMarker.current.openPopup();
    }

    // Fit map to show both user location and hospital
    const bounds = L.latLngBounds([userLocation.lat, userLocation.lng], [request.location.lat, request.location.lng]);
    leafletMap.current.fitBounds(bounds, { padding: [80, 80] });

    // Calculate distance
    const distance = calculateDistance(
      userLocation.lat, 
      userLocation.lng, 
      request.location.lat, 
      request.location.lng
    );

    // Show distance info at midpoint
    const midpoint = [
      (userLocation.lat + request.location.lat) / 2,
      (userLocation.lng + request.location.lng) / 2
    ];

    L.popup({ closeOnClick: false, autoClose: false })
      .setLatLng(midpoint)
      .setContent(`<div class="text-center p-2 bg-white rounded-lg shadow-lg border-2 border-red-500">
        <strong class="text-red-600">${distance.toFixed(2)} km</strong><br>
        <span class="text-xs text-gray-600">${language === 'en' ? 'Approx.' : 'আনুমানিক'} ${Math.round(distance * 2)} ${language === 'en' ? 'min drive' : 'মিনিট গাড়ি'}</span>
      </div>`)
      .openOn(leafletMap.current);
  };

  const openGoogleMaps = (request: BloodRequest) => {
    if (!userLocation) {
      // Open destination only
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${request.location.lat},${request.location.lng}`,
        '_blank'
      );
    } else {
      // Open with directions
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${request.location.lat},${request.location.lng}&travelmode=driving`,
        '_blank'
      );
    }
  };

  const handleAccept = async (request: BloodRequest) => {
    showDirections(request);
    
    // Also mark as accepted in backend
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('jwt_token');
      
      const response = await fetch(`${API_URL}/requests/${request.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        alert(language === 'en' 
          ? 'Request accepted! Please contact the hospital.' 
          : 'অনুরোধ গৃহীত! অনুগ্রহ করে হাসপাতালে যোগাযোগ করুন।');
        fetchRequests(); // Refresh list
      }
    } catch (error) {
      console.error('Accept request error:', error);
    }
  };

  const focusOnRequest = (lat: number, lng: number) => {
    if (leafletMap.current) {
      // If user location is available, fit bounds to show both
      if (userLocation) {
        const bounds = L.latLngBounds([userLocation.lat, userLocation.lng], [lat, lng]);
        leafletMap.current.flyToBounds(bounds, { 
          padding: [80, 80],
          duration: 1.5 
        });
      } else {
        leafletMap.current.flyTo([lat, lng], 14, { duration: 1.5 });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-10rem)]">
      <div className="lg:col-span-2 bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-red-100/30 border border-gray-100 relative">
        <div ref={mapRef} className="absolute inset-0 z-0"></div>
        
        {/* Map Controls */}
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
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
            {userLocation && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">
                  {language === 'en' ? 'You' : 'আপনি'}
                </span>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => {
            // Clear selected request and route
            setSelectedRequest(null);
            if (routeLayer.current) routeLayer.current.clearLayers();
            if (hospitalMarker.current && leafletMap.current) {
              leafletMap.current.removeLayer(hospitalMarker.current);
              hospitalMarker.current = null;
            }
            
            // Reset map view
            if (userLocation && leafletMap.current) {
              leafletMap.current.setView([userLocation.lat, userLocation.lng], 13);
            } else if (leafletMap.current) {
              leafletMap.current.setView([23.8103, 90.4125], 7);
            }
          }}
          className="absolute top-6 right-6 z-10 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 hover:bg-gray-50 transition-all active:scale-95"
          title={language === 'en' ? 'Reset View' : 'দেখুন রিসেট করুন'}
        >
          <Navigation size={20} className="text-gray-600" />
        </button>

        {!userLocation && (
          <button 
            onClick={getUserLocation}
            className="absolute bottom-6 right-6 z-10 bg-blue-600 text-white px-4 py-3 rounded-2xl shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 font-bold text-sm"
          >
            <Navigation2 size={18} />
            {language === 'en' ? 'Enable Location' : 'অবস্থান সক্ষম করুন'}
          </button>
        )}
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        <div className="sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10 py-2 mb-2">
          <h3 className="font-black text-gray-900 text-xl tracking-tight">
            {language === 'en' ? 'Live Requests' : 'লাইভ রিকোয়েস্ট'}
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {loading ? (
              <span className="animate-pulse">{language === 'en' ? 'Loading...' : 'লোড হচ্ছে...'}</span>
            ) : (
              `${requests.length} ${language === 'en' ? 'Requests Found' : 'অনুরোধ পাওয়া গেছে'}`
            )}
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-gray-400" size={32} />
            </div>
            <p className="text-sm font-bold text-gray-400">
              {language === 'en' ? 'No active requests at the moment' : 'এই মুহূর্তে কোনো সক্রিয় অনুরোধ নেই'}
            </p>
          </div>
        ) : (
          requests.map((req) => {
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, req.location.lat, req.location.lng)
              : null;

            return (
              <div 
                key={req.id} 
                onClick={() => {
                  setSelectedRequest(req);
                  if (userLocation) {
                    showDirections(req);
                  } else {
                    focusOnRequest(req.location.lat, req.location.lng);
                  }
                }}
                className={`bg-white p-6 rounded-[2rem] border-2 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group ${
                  selectedRequest?.id === req.id ? 'border-red-500 bg-red-50' : 'border-gray-100'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
                    req.urgency === 'EMERGENCY' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    {req.urgency === 'EMERGENCY' ? (language === 'en' ? 'EMERGENCY' : 'জরুরী') : (language === 'en' ? 'NORMAL' : 'সাধারণ')}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase">
                    <Clock size={12} /> {req.timestamp ? new Date(req.timestamp).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 ${
                    req.urgency === 'EMERGENCY' ? 'bg-red-600 text-white border-red-700' : 'bg-blue-600 text-white border-blue-700'
                  } shadow-lg transition-transform group-hover:scale-110`}>
                    <span className="text-xl font-black leading-none">{req.bloodGroup}</span>
                    <span className="text-[8px] font-black uppercase mt-1">{req.unitsNeeded}U</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-gray-900 leading-tight group-hover:text-red-600 transition-colors">{req.hospitalName}</h4>
                    <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-red-500" /> {req.location.address}
                    </p>
                    {distance && (
                      <p className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-1">
                        <Navigation2 size={12} /> {distance.toFixed(1)} km away • ~{Math.round(distance * 2)} min
                      </p>
                    )}
                  </div>
                </div>

                {req.isThalassemiaPatient && (
                  <div className="bg-purple-50 p-3 rounded-xl flex items-center gap-2 mb-5 text-purple-700 text-xs font-black border border-purple-100">
                    <ShieldCheck size={16} /> {language === 'en' ? 'THALASSEMIA SUPPORT' : 'থ্যালাসেমিয়া সহায়তা'}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleAccept(req); 
                    }}
                    className="flex items-center justify-center gap-1 bg-gray-900 text-white py-3 rounded-xl text-xs font-black hover:bg-black transition-all active:scale-95 uppercase tracking-widest"
                  >
                    {language === 'en' ? 'Accept' : 'গ্রহণ'}
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      window.location.href=`tel:${req.contactPhone}`; 
                    }}
                    className="flex items-center justify-center gap-1 bg-white border border-gray-200 text-gray-900 py-3 rounded-xl text-xs font-black hover:bg-gray-50 transition-all active:scale-95 uppercase tracking-widest"
                  >
                    <Phone size={14} /> {language === 'en' ? 'Call' : 'কল'}
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      openGoogleMaps(req); 
                    }}
                    className="flex items-center justify-center gap-1 bg-blue-600 text-white py-3 rounded-xl text-xs font-black hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}

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