const App = {
    data: [],
    filteredData: [],
    map: null,
    currentMarkers: [],
    currentFilter: 'all', // 'all', 'direct', '1-stop'

    init: async () => {
        App.initMap();
        App.setupMapToggle();
        await App.fetchData();
        App.setupFilters();
        App.applyFilter('all'); // Default filter
    },

    initMap: () => {
        // Initialize with a default view, will be updated when data loads
        App.map = L.map('map').setView([50, 10], 4);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(App.map);
    },

    setupMapToggle: () => {
        const toggleBtn = document.getElementById('map-toggle');
        const mapContainer = document.getElementById('map-container');

        if (toggleBtn && mapContainer) {
            toggleBtn.addEventListener('click', () => {
                mapContainer.classList.toggle('expanded');
                const isExpanded = mapContainer.classList.contains('expanded');
                toggleBtn.textContent = isExpanded ? 'Collapse Map' : 'Expand Map';

                // Invalidate map size after transition to ensure tiles load correctly
                setTimeout(() => {
                    App.map.invalidateSize();
                }, 300);
            });
        }
    },

    fetchData: async () => {
        try {
            const response = await fetch('data/destinations.json');
            App.data = await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            // Fallback for local testing without server if fetch fails (optional, but good for robustness)
            document.querySelector('.destination-list').innerHTML = '<li style="padding:20px; color:red">Error loading data. Please run via a local server.</li>';
        }
    },

    setupFilters: () => {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add to clicked
                e.target.classList.add('active');

                const filterType = e.target.dataset.filter;
                App.applyFilter(filterType);
            });
        });
    },

    applyFilter: (filterType) => {
        App.currentFilter = filterType;

        if (filterType === 'all') {
            App.filteredData = App.data;
        } else {
            App.filteredData = App.data.filter(city => city.connectionType === filterType);
        }

        App.renderList();

        // Select the first item in the filtered list if available
        if (App.filteredData.length > 0) {
            App.selectCity(App.filteredData[0]);
        }
    },

    renderList: () => {
        const listContainer = document.getElementById('destination-list');
        listContainer.innerHTML = '';

        if (App.filteredData.length === 0) {
            listContainer.innerHTML = '<li class="destination-item">No destinations found.</li>';
            return;
        }

        App.filteredData.forEach(city => {
            const li = document.createElement('li');
            li.className = 'destination-item';
            li.dataset.id = city.id;
            li.innerHTML = `
                <h3>${city.name}</h3>
                <div class="destination-meta">
                    <span>${city.country}</span>
                    <span>${city.flightTime}</span>
                </div>
            `;
            li.addEventListener('click', () => App.selectCity(city));
            listContainer.appendChild(li);
        });
    },

    selectCity: (city) => {
        // Update active state in list
        document.querySelectorAll('.destination-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === city.id) {
                item.classList.add('active');
            }
        });

        App.renderDetails(city);
        App.updateMap(city);
    },

    renderDetails: (city) => {
        const container = document.getElementById('city-details');

        const bannerHtml = city.bannerImage ? `<img src="${city.bannerImage}" class="city-banner" alt="${city.name} Banner">` : '';
        const dayTripIntroHtml = city.dayTripIntro ? `<p class="section-intro">${city.dayTripIntro}</p>` : '';

        const dayTripsHtml = city.dayTrips.map(trip => `
            <li class="day-trip-item">
                ${trip.image ? `<img src="${trip.image}" class="content-image" alt="${trip.title}">` : ''}
                <h4>${trip.title}</h4>
                <p>${trip.description}</p>
            </li>
        `).join('');

        const connectionBadge = city.connectionType === 'direct'
            ? '<span class="badge direct">Direct</span>'
            : '<span class="badge warning">1 Stop</span>';

        let gettingAroundHtml = '';
        let primaryDestHtml = '';
        let attractionsHtml = '';
        let foodHtml = '';
        let itineraryHtml = '';
        let historicalContextHtml = '';

        if (city.historicalContext) {
            const sections = city.historicalContext.sections.map(section => {
                const items = section.items.map(item => `
                    <div class="section-list-item">
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                    </div>
                `).join('');
                return `
                    <div class="extended-section">
                        <h3>${section.title}</h3>
                        ${items}
                    </div>
                `;
            }).join('');

            historicalContextHtml = `
                <div class="historical-context-section">
                    <h2>Historical Context</h2>
                    ${sections}
                </div>
            `;
        }

        if (city.extendedDetails) {
            const ed = city.extendedDetails;

            if (ed.gettingAround) {
                gettingAroundHtml = `
                    <div class="extended-section">
                        <h3>Getting Around</h3>
                        <p>${ed.gettingAround.text}</p>
                        ${ed.gettingAround.note ? `<p class="transit-note">🚨 ${ed.gettingAround.note}</p>` : ''}
                    </div>
                `;
            }

            if (ed.primaryDestination) {
                const items = ed.primaryDestination.items.map(item => `
                    <div class="section-list-item">
                        ${item.image ? `<img src="${item.image}" class="content-image" alt="${item.title}">` : ''}
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                    </div>
                `).join('');
                primaryDestHtml = `
                    <div class="extended-section">
                        <h3>${ed.primaryDestination.title}</h3>
                        ${items}
                    </div>
                `;
            }

            if (ed.attractions) {
                const items = ed.attractions.items.map(item => `
                    <div class="section-list-item">
                        ${item.image ? `<img src="${item.image}" class="content-image" alt="${item.title}">` : ''}
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                    </div>
                `).join('');
                attractionsHtml = `
                    <div class="extended-section">
                        <h3>${ed.attractions.title}</h3>
                        ${items}
                    </div>
                `;
            }

            if (ed.food) {
                const items = ed.food.items.map(item => `
                    <div class="section-list-item">
                        ${item.image ? `<img src="${item.image}" class="content-image" alt="${item.title}">` : ''}
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                    </div>
                `).join('');
                foodHtml = `
                    <div class="extended-section">
                        <h3>${ed.food.title}</h3>
                        ${items}
                    </div>
                `;
            }

            if (ed.itinerary) {
                const items = ed.itinerary.items.map(item => `
                    <div class="itinerary-item">
                        <strong>${item.day}:</strong> ${item.activity}
                    </div>
                `).join('');
                itineraryHtml = `
                    <div class="extended-section">
                        <h3>${ed.itinerary.title}</h3>
                        <div class="itinerary-list">
                            ${items}
                        </div>
                    </div>
                `;
            }
        }

        container.innerHTML = `
            ${bannerHtml}
            <div class="city-header">
                <h2>${city.name}, ${city.country}</h2>
                ${connectionBadge}
            </div>

            <div class="travel-info">
                <div class="travel-stat">
                    <span>Flight Time</span>
                    <span>${city.flightTime}</span>
                </div>
                <div class="travel-stat">
                    <span>Route</span>
                    <span>${city.route}</span>
                </div>
            </div>

            ${gettingAroundHtml}

            <p>${city.description}</p>

            ${primaryDestHtml}

            <div class="day-trips-section">
                <h3>Top Day Trips & Walks</h3>
                ${dayTripIntroHtml}
                <ul class="day-trips-list">
                    ${dayTripsHtml}
                </ul>
            </div>

            ${attractionsHtml}
            ${foodHtml}
            ${itineraryHtml}
            ${historicalContextHtml}
        `;
    },

    updateMap: (city) => {
        try {
            // Clear existing markers
            App.currentMarkers.forEach(marker => App.map.removeLayer(marker));
            App.currentMarkers = [];

            // Set view with animation disabled for stability
            App.map.setView(city.map.center, city.map.zoom, { animate: false });

            if (city.map.markers.length > 0) {
                const primarySpot = city.map.markers[0];
                const primaryLatLng = L.latLng(primarySpot.coords);

                city.map.markers.forEach((spot, index) => {
                    const spotLatLng = L.latLng(spot.coords);

                    // Add marker
                    const marker = L.marker(spot.coords)
                        .addTo(App.map)
                        .bindPopup(`<b>${spot.title}</b>`);
                    App.currentMarkers.push(marker);

                    // Draw line from primary if distant enough (> 2km) and not the primary itself
                    if (index > 0) {
                        const distance = primaryLatLng.distanceTo(spotLatLng);
                        if (distance > 2000) {
                             const polyline = L.polyline([primarySpot.coords, spot.coords], {
                                color: '#3498db', // accent-color
                                weight: 2,
                                opacity: 0.6,
                                dashArray: '5, 10'
                            }).addTo(App.map);
                            App.currentMarkers.push(polyline);
                        }
                    }
                });
            }
        } catch (e) {
            console.error('Error in updateMap:', e);
        }
    }
};

document.addEventListener('DOMContentLoaded', App.init);
