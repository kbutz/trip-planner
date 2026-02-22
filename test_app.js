const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/destinations.json', 'utf8'));

const App = {
    data: data,
    filteredData: [],

    applyFilter: (filterType) => {
        if (filterType === 'all') {
            App.filteredData = App.data;
        } else {
            App.filteredData = App.data.filter(city => city.connectionType === filterType);
        }
        console.log(`Filter: ${filterType}, Count: ${App.filteredData.length}`);
        App.filteredData.forEach(city => console.log(` - ${city.name} (${city.connectionType})`));
    }
};

App.applyFilter('all');
App.applyFilter('direct');
App.applyFilter('1-stop');
