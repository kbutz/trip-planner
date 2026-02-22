const fs = require('fs');

// Mock DOM
const document = {
    getElementById: (id) => {
        return {
            innerHTML: '',
            appendChild: (child) => {
                // If it's destination-list, log the item
                if (id === 'destination-list') {
                     // Extract name from innerHTML
                     const match = /<h3>(.*?)<\/h3>/.exec(child.innerHTML);
                     if (match) {
                         console.log(`Rendered: ${match[1]}`);
                     }
                }
            },
            classList: {
                toggle: () => {},
                contains: () => false
            },
            addEventListener: (event, cb) => {}
        };
    },
    createElement: (tag) => {
        return {
            className: '',
            dataset: {},
            innerHTML: '',
            addEventListener: () => {},
            classList: {
                add: () => {},
                remove: () => {}
            }
        };
    },
    querySelectorAll: (selector) => {
        return [];
    },
    querySelector: (selector) => {
        return { innerHTML: '' };
    },
    addEventListener: (event, callback) => {
        if (event === 'DOMContentLoaded') {
            // We'll call App.init manually if needed, but the script calls it
            // wait for eval to finish
            setTimeout(callback, 100);
        }
    }
};

// Mock Leaflet
const L = {
    map: () => ({
        setView: () => {},
        removeLayer: () => {},
        invalidateSize: () => {}
    }),
    tileLayer: () => ({ addTo: () => {} }),
    marker: () => ({ addTo: () => ({ bindPopup: () => {} }) }),
    polyline: () => ({ addTo: () => {} }),
    latLng: () => ({ distanceTo: () => 0 })
};

// Mock Fetch
global.fetch = async (url) => {
    console.log(`Fetching ${url}`);
    const filepath = url.split('?')[0];
    const content = fs.readFileSync(filepath, 'utf8');
    return {
        json: async () => JSON.parse(content)
    };
};

global.document = document;
global.L = L;

// Load App
const appCode = fs.readFileSync('js/app.js', 'utf8');
eval(appCode);
