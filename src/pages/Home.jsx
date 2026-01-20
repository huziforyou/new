import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import axios from 'axios';
import { useUser } from '../Context/UserContext';
import { FaDirections, FaTimes } from 'react-icons/fa';
import { useMap } from '../Context/MapContext';

const containerStyle = { width: '100%', height: '100vh' };
const pakistanBounds = { north: 37.0, south: 23.5, west: 60.9, east: 77.0 };

const darkMapStyle = [
  // ... (your dark map style remains unchanged)
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#1e1e1e" }] },
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { weight: 2 }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#3a3a3a" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#444444" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] }
];

const getMarkerIcon = (email) => {
  // Simple hash to color or just random colors, or specific mapping if possible.
  // For now, let's use a default blue dot. 
  // Ideally we generate a color based on email string to be consistent.
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  const hex = "00000".substring(0, 6 - c.length) + c;
  return `http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${hex}`;
};

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const { user, token } = useUser();
  const { mapCenter, mapZoom } = useMap();

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  // ✅ CHANGED: Fetch allowed emails and then their images
  useEffect(() => {
    let isMounted = true;
    const fetchImages = async () => {
      try {
        setMapReady(false); // Optional: show loading state if needed, or just let markers pop in
        // 1. Get Allowed Emails (The "New" Dynamic Source)
        const emailsRes = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/image-sources`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Ensure we filter out any null/undefined emails and lowercase them
        const allowedEmails = emailsRes.data
          .map(e => e.email ? e.email.toLowerCase() : null)
          .filter(Boolean);

        let emailsToFetch = [];

        // 2. Filter based on permissions (Strict "By Email" Logic)
        if (user?.role === 'admin') {
          // Admin sees ALL allowed emails
          emailsToFetch = allowedEmails;
        } else {
          // Users see ONLY emails they have explicit permission for
          const userPerms = (user?.permissions || []).map(p => p ? p.toLowerCase() : "");
          emailsToFetch = allowedEmails.filter(email => userPerms.includes(email));
        }

        // 3. Filter based on UI selection (Dropdown)
        if (selectedFilter !== 'All') {
          const selectedLower = selectedFilter.toLowerCase();
          // If selected filter is valid and permitted
          if (emailsToFetch.includes(selectedLower)) {
            emailsToFetch = [selectedLower];
          } else {
            // If user selects something they shouldn't have access to, fetch nothing
            if (isMounted) setImages([]);
            return;
          }
        }

        console.log("Fetching images for:", emailsToFetch);

        // 4. Fetch images for each authorized email in parallel
        const validImages = [];

        await Promise.all(emailsToFetch.map(async (email) => {
          try {
            const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/getImages/${email}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const emailImages = res.data.photos.map(img => ({
              ...img,
              emailKey: email,
              url: `${import.meta.env.VITE_BASE_URL}/photos/image-data/${img._id}`,
              icon: getMarkerIcon(email)
            }));
            validImages.push(...emailImages);
          } catch (innerErr) {
            console.warn(`Failed to fetch images for ${email}:`, innerErr.message);
          }
        }));

        // Filter out images without valid coordinates to prevent map errors
        const filteredImages = validImages.filter(img => img.latitude && img.longitude);

        if (isMounted) {
          setImages(filteredImages);
          setMapReady(true);
        }

      } catch (err) {
        console.error("Error fetching home images", err);
      }
    };

    if (user) {
      fetchImages();
    }

    return () => { isMounted = false; };
  }, [user, selectedFilter]);

  // Dynamic filters
  const [availableFilters, setAvailableFilters] = useState(['All']);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/image-sources`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const allEmails = res.data.map(e => e.email.toLowerCase());

        if (user?.role === 'admin') {
          setAvailableFilters(['All', ...allEmails]);
        } else {
          // Filter available options based on user permissions
          const userPerms = (user?.permissions || []).map(p => p?.toLowerCase());
          const permittedEmails = allEmails.filter(e => userPerms.includes(e));
          setAvailableFilters(['All', ...permittedEmails]);
        }
      } catch (e) { console.error(e); }
    };
    if (user) loadFilters();
  }, [user]);

  // Removed permissions logic from here as it is handled in useEffect state
  // const filters = ['All']; ...

  const heatmapData = images.map(img => new window.google.maps.LatLng(img.latitude, img.longitude));

  return (
    <div className="h-screen w-full relative">
      {/* Controls */}
      <div className="absolute z-10 top-2 left-1/2 transform -translate-x-1/2 flex gap-2 p-2">
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="border px-3 py-1 dark:bg-zinc-800 bg-white dark:text-white text-black text-center rounded text-sm"
        >
          {availableFilters.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
        </button>
      </div>

      {/* Google Map */}
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={['visualization']}>
        <GoogleMap
          key={`${mapCenter.lat}-${mapCenter.lng}-${mapZoom}`}
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={mapZoom}
          onLoad={() => setMapReady(true)}
          options={{
            styles: isDarkMode ? darkMapStyle : undefined,
            disableDefaultUI: false,
            restriction: { latLngBounds: pakistanBounds, strictBounds: true },
            gestureHandling: 'greedy'
          }}
        >
          {/* Markers */}
          {mapReady && images.map((img, index) => (
            <Marker
              // ✅ CHANGED: Use `img._id` for a more reliable unique key
              key={img._id || index}
              position={{ lat: img.latitude, lng: img.longitude }}
              onClick={() => setSelectedImage({ ...img, zoom: false })}
              icon={img.icon}
            />
          ))}

          {/* Heatmap */}
          {mapReady && showHeatmap && heatmapData.length > 0 && (
            <HeatmapLayer data={heatmapData} options={{ radius: 50 }} />
          )}

          {/* InfoWindow with Zoom + Preview */}
          {selectedImage && (
            <InfoWindow
              position={{ lat: selectedImage.latitude, lng: selectedImage.longitude }}
              onCloseClick={() => setSelectedImage(null)}
            >
              <div className="w-fit max-w-sm p-2 rounded-md bg-white shadow-lg relative">
                <div className="relative group">
                  <img
                    src={selectedImage.url} // This will now correctly point to the database endpoint
                    alt={selectedImage.name}
                    onClick={() => setPreviewImage(selectedImage.url)}
                    className={`w-full object-contain rounded cursor-pointer transition-transform duration-300 ${selectedImage.zoom ? 'scale-125' : 'scale-100'}`}
                    style={{ height: selectedImage.zoom ? '300px' : '160px' }}
                  />

                  {/* Zoom Controls */}
                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() =>
                        setSelectedImage(prev => ({ ...prev, zoom: true }))
                      }
                      className="bg-black/70 text-white px-2 py-1 rounded text-xs hover:bg-black"
                    >
                      +
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImage(prev => ({ ...prev, zoom: false }))
                      }
                      className="bg-black/70 text-white px-2 py-1 rounded text-xs hover:bg-black"
                    >
                      −
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-sm space-y-1">
                  <p className="text-gray-400">
                    <span className="font-semibold text-black">GPS:</span> {selectedImage.latitude}, {selectedImage.longitude}
                  </p>
                  <div className="text-gray-400">
                    <p><span className="font-semibold text-black">District:</span> {selectedImage.district || '—'}</p>
                    <p><span className="font-semibold text-black">Village:</span> {selectedImage.village || '—'}</p>
                    <p><span className="font-semibold text-black">Tehsil:</span> {selectedImage.tehsil || '—'}</p>
                    <p><span className="font-semibold text-black">Country:</span> {selectedImage.country || '—'}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    <span className="uppercase font-semibold text-black">Uploaded by:</span> {selectedImage.uploadedBy}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedImage.latitude},${selectedImage.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded"
                  >
                    Get Directions <FaDirections />
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="relative max-w-4xl w-full mx-4">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 bg-white text-black rounded-full p-2 hover:bg-gray-200 transition"
            >
              <FaTimes />
            </button>
            <img
              src={previewImage} // This will also correctly point to the database endpoint
              alt="Preview"
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
