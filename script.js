// Configuration
const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImE0NjUyM2QxNmFhNDQ5NGJhMWJjZDg0ZWNkM2FlYzFmIiwiaCI6Im11cm11cjY0In0=';
const PHONE_NUMBER = '6283817779643'; // WhatsApp number with country code
const EMAIL = 'cocspedsafliz@gmail.com';

// Tawangmangu coordinates (central location)
const TAWANGMANGU_CENTER = [-7.6667, 111.1333];
const MAP_ZOOM = 13;

// Global variables
let map;
let pickupMarker = null;
let destinationMarker = null;
let routeControl = null;
let pickupLocation = null;
let destinationLocation = null;
let isGettingLocation = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupEventListeners();
    setupNavigation();
    getUserLocation();
});

// Initialize Leaflet map
function initializeMap() {
    // Create map centered on Tawangmangu
    map = L.map('map').setView(TAWANGMANGU_CENTER, MAP_ZOOM);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add click event listener to map
    map.on('click', handleMapClick);

    // Custom marker icons
    window.pickupIcon = L.divIcon({
        className: 'custom-pickup-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    window.destinationIcon = L.divIcon({
        className: 'custom-destination-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

// Get user's current location automatically
function getUserLocation() {
    if ("geolocation" in navigator) {
        isGettingLocation = true;
        // Set initial status
        document.getElementById('pickup-status').textContent = 'Mendapatkan lokasi GPS...';
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Set as pickup location
                setPickupLocation(lat, lng);
                isGettingLocation = false;
            },
            function(error) {
                console.log("Geolocation error:", error);
                document.getElementById('pickup-status').textContent = 'Klik peta untuk pilih lokasi';
                isGettingLocation = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    } else {
        document.getElementById('pickup-status').textContent = 'Klik peta untuk pilih lokasi';
    }
}

// Set pickup location
function setPickupLocation(lat, lng) {
    pickupLocation = { lat, lng };
    
    // Remove existing pickup marker
    if (pickupMarker) {
        map.removeLayer(pickupMarker);
    }
    
    // Add new pickup marker
    pickupMarker = L.marker([lat, lng], { icon: window.pickupIcon })
        .addTo(map)
        .bindPopup('Lokasi Pengirim');
    
    updateCalculateButton();
}



// Handle map click events
function handleMapClick(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    if (!pickupLocation && !isGettingLocation) {
        // Set pickup location manually if auto-location failed
        setPickupLocation(lat, lng);
        
    } else if (!destinationLocation) {
        // Set destination location
        setDestinationLocation(lat, lng);
        
    } else {
        // Both locations are set, reset destination and set new one
        if (destinationMarker) {
            map.removeLayer(destinationMarker);
        }
        
        destinationLocation = { lat, lng };
        destinationMarker = L.marker([lat, lng], { icon: window.destinationIcon })
            .addTo(map)
            .bindPopup('Lokasi Tujuan')
            .openPopup();
        
        document.getElementById('destination-status').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        updateCalculateButton();
    }
}

// Set pickup location
function setPickupLocation(lat, lng) {
    pickupLocation = { lat, lng };
    
    // Remove existing pickup marker
    if (pickupMarker) {
        map.removeLayer(pickupMarker);
    }
    
    // Add new pickup marker
    pickupMarker = L.marker([lat, lng], { icon: window.pickupIcon })
        .addTo(map)
        .bindPopup('Lokasi Pengirim')
        .openPopup();
    
    // Update pickup status
    document.getElementById('pickup-status').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Update calculate button state
    updateCalculateButton();
}

// Set destination location
function setDestinationLocation(lat, lng) {
    destinationLocation = { lat, lng };
    
    // Remove existing destination marker
    if (destinationMarker) {
        map.removeLayer(destinationMarker);
    }
    
    // Add new destination marker
    destinationMarker = L.marker([lat, lng], { icon: window.destinationIcon })
        .addTo(map)
        .bindPopup('Lokasi Tujuan')
        .openPopup();
    
    // Update destination status
    document.getElementById('destination-status').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Update calculate button state
    updateCalculateButton();
}

// Reset all locations
function resetLocations() {
    pickupLocation = null;
    destinationLocation = null;
    
    // Remove markers
    if (pickupMarker) {
        map.removeLayer(pickupMarker);
        pickupMarker = null;
    }
    
    if (destinationMarker) {
        map.removeLayer(destinationMarker);
        destinationMarker = null;
    }
    
    // Remove route
    if (routeControl) {
        map.removeControl(routeControl);
        routeControl = null;
    }
    
    // Update status
    document.getElementById('pickup-status').textContent = 'Belum dipilih';
    document.getElementById('destination-status').textContent = 'Belum dipilih';
    
    // Hide results
    document.getElementById('results').classList.add('hidden');
    document.getElementById('order-btn').classList.add('hidden');
    
    // Update calculate button state
    updateCalculateButton();
}



// Update calculate button state
function updateCalculateButton() {
    const calculateBtn = document.getElementById('calculate-btn');
    const weightInput = document.getElementById('weight');
    const senderNameInput = document.getElementById('sender-name');
    const receiverNameInput = document.getElementById('receiver-name');
    
    const hasLocations = pickupLocation && destinationLocation;
    const hasWeight = weightInput.value && parseFloat(weightInput.value) > 0;
    const hasSenderName = senderNameInput.value.trim().length > 0;
    const hasReceiverName = receiverNameInput.value.trim().length > 0;
    
    calculateBtn.disabled = !(hasLocations && hasWeight && hasSenderName && hasReceiverName);
}

// Setup event listeners
function setupEventListeners() {
    // Input field listeners
    document.getElementById('weight').addEventListener('input', updateCalculateButton);
    document.getElementById('sender-name').addEventListener('input', updateCalculateButton);
    document.getElementById('receiver-name').addEventListener('input', updateCalculateButton);
    
    // Calculate button listener
    document.getElementById('calculate-btn').addEventListener('click', calculateShippingCost);
    
    // Order button listener
    document.getElementById('order-btn').addEventListener('click', handleOrderClick);
    
    // Contact form listener
    document.getElementById('contact-form').addEventListener('submit', handleContactSubmit);
}

// Calculate shipping cost
async function calculateShippingCost() {
    if (!pickupLocation || !destinationLocation) {
        alert('Pilih lokasi pengirim dan tujuan terlebih dahulu');
        return;
    }
    
    const weight = parseFloat(document.getElementById('weight').value);
    if (!weight || weight <= 0) {
        alert('Masukkan berat paket yang valid');
        return;
    }
    
    const senderName = document.getElementById('sender-name').value.trim();
    const receiverName = document.getElementById('receiver-name').value.trim();
    
    if (!senderName) {
        alert('Masukkan nama pengirim');
        return;
    }
    
    if (!receiverName) {
        alert('Masukkan nama penerima');
        return;
    }
    
    // Show loading
    showLoading(true);
    
    try {
        // Calculate distance using OpenRouteService
        const distance = await calculateDistance(pickupLocation, destinationLocation);
        
        // Calculate costs
        const distanceCost = distance * 1500; // Distance cost: Rp 1500 per km
        const weightCost = weight * 3000; // Weight cost: Rp 3000 per kg
        let totalCost = distanceCost + weightCost;
        
        // Apply minimum tariff of Rp 10,000
        const minimumCost = 10000;
        if (totalCost < minimumCost) {
            totalCost = minimumCost;
        }
        
        // Display results
        displayResults(distance, weight, distanceCost, weightCost, totalCost);
        
        // Show order button
        document.getElementById('order-btn').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error calculating shipping cost:', error);
        alert('Gagal menghitung ongkir. Pastikan koneksi internet stabil dan coba lagi.');
    } finally {
        showLoading(false);
    }
}

// Calculate distance using OpenRouteService API with fallback to Haversine formula
async function calculateDistance(pickup, destination) {
    try {
        // First try OpenRouteService API
        const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
        
        const coordinates = [
            [pickup.lng, pickup.lat],
            [destination.lng, destination.lat]
        ];
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                'Authorization': API_KEY,
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                coordinates: coordinates
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
            // Distance is in meters, convert to kilometers
            const distanceInKm = data.routes[0].summary.distance / 1000;
            return Math.round(distanceInKm * 100) / 100; // Round to 2 decimal places
        } else {
            throw new Error('No route found from API');
        }
    } catch (error) {
        console.warn('API routing failed, using direct distance calculation:', error);
        
        // Fallback to Haversine formula for direct distance
        // Add 20% to account for road curves and detours
        const directDistance = calculateHaversineDistance(pickup, destination);
        const roadDistance = directDistance * 1.2; // Add 20% for road routing
        
        return Math.round(roadDistance * 100) / 100; // Round to 2 decimal places
    }
}

// Calculate direct distance using Haversine formula
function calculateHaversineDistance(pickup, destination) {
    const R = 6371; // Earth's radius in kilometers
    
    const lat1Rad = pickup.lat * Math.PI / 180;
    const lat2Rad = destination.lat * Math.PI / 180;
    const deltaLatRad = (destination.lat - pickup.lat) * Math.PI / 180;
    const deltaLngRad = (destination.lng - pickup.lng) * Math.PI / 180;
    
    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in kilometers
}

// Display calculation results
function displayResults(distance, weight, distanceCost, weightCost, totalCost) {
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };
    
    // Update result elements
    document.getElementById('distance-result').textContent = `${distance} km`;
    document.getElementById('weight-result').textContent = `${weight} kg`;
    document.getElementById('cost-result').textContent = formatCurrency(totalCost);
    document.getElementById('distance-cost').textContent = formatCurrency(distanceCost);
    document.getElementById('weight-cost').textContent = formatCurrency(weightCost);
    
    // Show results
    document.getElementById('results').classList.remove('hidden');
}

// Handle order button click
function handleOrderClick() {
    const weight = parseFloat(document.getElementById('weight').value);
    const senderName = document.getElementById('sender-name').value.trim();
    const receiverName = document.getElementById('receiver-name').value.trim();
    const distance = parseFloat(document.getElementById('distance-result').textContent.replace(' km', ''));
    const cost = parseInt(document.getElementById('cost-result').textContent.replace(/[^\d]/g, ''));
    
    const orderData = {
        "pengirim": {
            "nama": senderName,
            "lokasi": `${pickupLocation.lat.toFixed(6)}, ${pickupLocation.lng.toFixed(6)}`
        },
        "penerima": {
            "nama": receiverName,
            "lokasi": `${destinationLocation.lat.toFixed(6)}, ${destinationLocation.lng.toFixed(6)}`
        },
        "beratKg": weight,
        "jarakKm": distance,
        "ongkir": cost
    };
    
    const jsonMessage = JSON.stringify(orderData, null, 2);
    const message = `Halo SANTRI EXPRESS!

Saya ingin memesan jasa pengiriman:

\`\`\`json
${jsonMessage}
\`\`\`

Mohon konfirmasi ketersediaan layanan. Terima kasih!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

// Handle contact form submission
function handleContactSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const messageText = document.getElementById('message').value;
    
    const message = `Halo SANTRI EXPRESS!

👤 *Informasi Kontak:*
• Nama: ${name}
• Telepon: ${phone}
• Email: ${email}

💬 *Pesan:*
${messageText}

Mohon segera direspon. Terima kasih!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

// Show/hide loading overlay
function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (show) {
        loadingElement.classList.remove('hidden');
    } else {
        loadingElement.classList.add('hidden');
    }
}

// Utility function to format coordinates for display
function formatCoordinates(lat, lng) {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// Error handling for API failures
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showLoading(false);
    alert('Terjadi kesalahan. Silakan coba lagi atau hubungi customer service.');
});

// Setup navigation functionality
function setupNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navClose = document.getElementById('nav-close');
    const navOverlay = document.getElementById('nav-overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Toggle mobile menu
    function toggleMenu() {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    }
    
    // Close mobile menu
    function closeMenu() {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Event listeners for menu toggle
    menuToggle.addEventListener('click', toggleMenu);
    navClose.addEventListener('click', closeMenu);
    navOverlay.addEventListener('click', closeMenu);
    
    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Close mobile menu
            closeMenu();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get target section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                // Smooth scroll to target section
                setTimeout(() => {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 300); // Small delay to allow menu to close
            }
        });
    });
    
    // Update active navigation on scroll
    window.addEventListener('scroll', function() {
        let current = '';
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.pageYOffset >= sectionTop && 
                window.pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        // Update active navigation link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    });
    
    // Close menu on window resize if open
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });
}

// Responsive map resize
window.addEventListener('resize', function() {
    if (map) {
        setTimeout(function() {
            map.invalidateSize();
        }, 100);
    }
});
