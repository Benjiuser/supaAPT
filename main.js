// main.js

let homeCityAutocomplete; 
let selectedCityPlace = null; 
let mapInitialized = false; // Track if map has been initialized

function showTab(tabId) {
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.style.display = 'none');

  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.style.display = 'block';

    // Update nav active state
    const navItems = document.querySelectorAll('nav ul li');
    navItems.forEach(item => item.classList.remove('active'));
    const linkItem = document.querySelector(`nav ul li a[href="#${tabId}"]`)?.parentElement;
    if (linkItem) linkItem.classList.add('active');

    // If we are on the saved tab, display saved apartments
    if (tabId === 'saved') {
      displaySavedApartments();
    }

    // If we are on the maps tab and map not initialized, initialize it
    if (tabId === 'maps' && !mapInitialized) {
      initMap();
      mapInitialized = true;
    }
  }
}
window.showTab = showTab;

window.initHomeAutocomplete = function() {
  const cityInput = document.getElementById('homeCityInput');
  homeCityAutocomplete = new google.maps.places.Autocomplete(cityInput, {
    types: ['(cities)']
  });

  homeCityAutocomplete.addListener('place_changed', () => {
    const place = homeCityAutocomplete.getPlace();
    if (place && place.geometry && place.geometry.location) {
      selectedCityPlace = place;
    }
  });
}

window.searchSelectedCity = function() {
  if (!selectedCityPlace) {
    alert("Please select a city from the suggestions.");
    return;
  }

  const location = selectedCityPlace.geometry.location;
  sessionStorage.setItem('initialCenterLat', location.lat());
  sessionStorage.setItem('initialCenterLng', location.lng());

  // Go to maps tab
  showTab('maps');
};
