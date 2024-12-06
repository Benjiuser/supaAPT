// main.js
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
  }
}

window.showTab = showTab;

// Search city from home screen and go to maps
window.searchCity = async function() {
  const cityInput = document.getElementById('homeCityInput').value.trim();
  if (!cityInput) {
    alert("Please enter a city first.");
    return;
  }
  
  // Geocode city
  const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY'; // replace if needed
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityInput)}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      // Store location so map.js can update map center after init
      sessionStorage.setItem('initialCenterLat', location.lat);
      sessionStorage.setItem('initialCenterLng', location.lng);
      
      // Go to maps tab
      showTab('maps');
      // The map initialization will check sessionStorage for initial center and update accordingly
    } else {
      alert("Could not find that city. Please try another.");
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    alert("There was a problem finding the city. Please try again.");
  }
};
