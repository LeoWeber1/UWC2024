mapboxgl.accessToken = 'pk.eyJ1Ijoib2JpZWxsYWxtIiwiYSI6ImNrdDR2MDhyNTAyZDYyd256M3QyaDV0c2sifQ.5CkLacUPx1JM_c281H96QA';

// Retrieve the last position and zoom level from localStorage
var lastLng = parseFloat(localStorage.getItem('lastLng')) || -74.5;
var lastLat = parseFloat(localStorage.getItem('lastLat')) || 40;
var lastZoom = parseFloat(localStorage.getItem('lastZoom')) || 9;

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    center: [lastLng, lastLat], // Set the initial position to the last position
    zoom: lastZoom // Set the initial zoom level to the last zoom level
});

// Add a moveend event listener to the map
map.on('moveend', function() {
    // Save the current position and zoom level to localStorage
    localStorage.setItem('lastLng', map.getCenter().lng);
    localStorage.setItem('lastLat', map.getCenter().lat);
    localStorage.setItem('lastZoom', map.getZoom());
});

map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
}));

const nav = new mapboxgl.NavigationControl();
map.addControl(nav);

map.addControl(new mapboxgl.FullscreenControl());

map.addControl(new MapboxDirections({accessToken: mapboxgl.accessToken,     interactive: false, unit: 'metric'}), 'top-left');


fetch('positions.csv')
    .then(response => response.text())
    .then(data => {
        const lines = data.split('\n'); // split the CSV file into lines
        lines.forEach(line => {
            const [lat, lng, label, temp, humidity] = line.split(','); // split each line into latitude, longitude, label, temperature, and humidity
            const marker = new mapboxgl.Marker() // create a new marker
                .setLngLat([parseFloat(lng), parseFloat(lat)]) // set the longitude and latitude
                .addTo(map); // add the marker to the map

            // Check if there's a locally stored label for this marker
            const storedLabel = localStorage.getItem(`label_${lat}_${lng}`);
            const popupLabel = storedLabel ? storedLabel : label;

            const popup = new mapboxgl.Popup().setHTML(`
                <h1 id="popup_${lat}_${lng}">${popupLabel}</h1>
                <p>Temperature: ${temp}°C</p>
                <p>Humidity: ${humidity}%</p>
            `);
            marker.setPopup(popup);

            // Add an event listener to the popup
            popup.on('open', () => {
                const popupElement = document.getElementById(`popup_${lat}_${lng}`);
                let clickCount = 0;
                popupElement.addEventListener('click', () => {
                    clickCount++;
                    if (clickCount === 2) {
                        // Create a custom modal
                        const modal = document.createElement('div');
                        modal.innerHTML = `
                            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center;">
                                <div style="background: white; padding: 20px; border-radius: 5px;">
                                    <label for="newLabel">Enter new label:</label>
                                    <input id="newLabel" type="text">
                                    <button id="submit">OK</button>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(modal);

                        // When the OK button is clicked, update the label and remove the modal
                        document.getElementById('submit').addEventListener('click', () => {
                            const newLabel = document.getElementById('newLabel').value;
                            if (newLabel) {
                                popupElement.textContent = newLabel;
                                localStorage.setItem(`label_${lat}_${lng}`, newLabel);
                            }
                            document.body.removeChild(modal);
                        });

                        clickCount = 0;
                    }
                });
            });
        });
    });