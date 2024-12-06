// map.js

let map;
let placesService;
let markers = [];
let infoWindow;
let apartmentsList;
let pagination = null;
let lastSearchCenter = null;
let lastZoomLevel = null;

const radiusInMeters = 16000; // about 10 miles

window.initMap = function() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 30.2672, lng: -97.7431 }, // Austin, TX
    zoom: 13,
    disableDefaultUI: false,
    gestureHandling: "greedy"
  });

  placesService = new google.maps.places.PlacesService(map);
  apartmentsList = document.getElementById('apartmentsList');
  infoWindow = new google.maps.InfoWindow();

  const input = document.getElementById('pac-input');
  const autocompleteOptions = {
    fields: ["geometry", "name"]
  };
  const autocomplete = new google.maps.places.Autocomplete(input, autocompleteOptions);
  autocomplete.bindTo('bounds', map);

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) return;
    map.setCenter(place.geometry.location);
    map.setZoom(13);
    maybeSearch();
  });

  // Trigger searches on map idle
  map.addListener('idle', () => {
    maybeSearch();
  });

  // Initial search
  maybeSearch();
};

function maybeSearch() {
  const currentCenter = map.getCenter();
  const currentZoom = map.getZoom();

  if (currentZoom < 13) {
    clearApartmentsList();
    clearMarkers();
    return;
  }

  if (shouldSearchAgain(currentCenter, currentZoom)) {
    lastSearchCenter = currentCenter;
    lastZoomLevel = currentZoom;
    initialSearch(currentCenter);
  }
}

function shouldSearchAgain(center, zoom) {
  if (!lastSearchCenter || lastZoomLevel === null) return true;
  if (zoom !== lastZoomLevel) return true;

  const latDiff = Math.abs(center.lat() - lastSearchCenter.lat());
  const lngDiff = Math.abs(center.lng() - lastSearchCenter.lng());
  return (latDiff > 0.005 || lngDiff > 0.005);
}

function initialSearch(center) {
  clearApartmentsList();
  clearMarkers();

  const request = {
    location: center,
    radius: radiusInMeters,
    keyword: 'apartment OR condo OR student housing'
  };

  placesService.nearbySearch(request, handleSearchResults);
}

function handleSearchResults(results, status, pag) {
  if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
    displayApartments(results);
    pagination = pag;

    if (pagination && pagination.hasNextPage) {
      // If more results are available, fetch them automatically
      setTimeout(() => pagination.nextPage(), 2000);
    }
  } else {
    console.log("No apartments found in this area.");
    clearApartmentsList();
  }
}

function displayApartments(places) {
  places.forEach((place) => {
    // Get details for each place to show images and website
    const detailsRequest = {
      placeId: place.place_id,
      fields: [
        'name', 'photos', 'vicinity', 'website', 'geometry', 'place_id'
      ]
    };

    placesService.getDetails(detailsRequest, (details, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && details) {
        addApartmentMarker(details);
        addApartmentToList(details);
      } else {
        // Fallback if details not available
        addApartmentMarker(place);
        addApartmentToList(place);
      }
    });
  });
}

function addApartmentMarker(details) {
  const marker = new google.maps.Marker({
    position: details.geometry.location,
    map: map,
    title: details.name
  });
  markers.push(marker);

  marker.addListener('click', () => {
    let contentString = `
      <div style="color:#000;">
        <h2>${details.name}</h2>
        <p><strong>Address:</strong> ${details.vicinity || 'N/A'}</p>
    `;

    if (details.website) {
      contentString += `<p><a href="${details.website}" target="_blank" rel="noopener">Website</a></p>`;
    }

    if (details.photos && details.photos.length > 0) {
      const photoUrl = details.photos[0].getUrl({ maxWidth: 300 });
      contentString += `
        <div style="margin-top: 10px;">
          <img src="${photoUrl}" alt="Apartment Photo" style="max-width:100%; height:auto; border-radius:5px;">
        </div>
      `;
    }

    contentString += `</div>`;

    infoWindow.setContent(contentString);
    infoWindow.open(map, marker);
  });

  return marker;
}

function addApartmentToList(details) {
  const li = document.createElement('li');
  li.className = 'apartment-item';

  let photoHtml = '';
  let photoUrl = '';
  if (details.photos && details.photos.length > 0) {
    photoUrl = details.photos[0].getUrl({ maxWidth: 200 });
    photoHtml = `<img src="${photoUrl}" alt="${details.name}" />`;
  }

  let websiteHtml = '';
  if (details.website) {
    websiteHtml = `<a href="${details.website}" target="_blank">Visit Website</a><br>`;
  }

  li.innerHTML = `
    <strong>${details.name}</strong><br>
    ${details.vicinity || 'Address not available'}<br>
    ${photoHtml}
    ${websiteHtml}
  `;

  // Add a save button
  const saveBtn = document.createElement('button');
  saveBtn.innerText = 'Save';
  saveBtn.addEventListener('click', () => {
    saveApartment({
      place_id: details.place_id,
      name: details.name,
      vicinity: details.vicinity,
      website: details.website || '',
      photo: photoUrl
    });
    alert('Apartment saved!');
  });
  li.appendChild(saveBtn);

  apartmentsList.appendChild(li);
}

function clearApartmentsList() {
  if (apartmentsList) {
    apartmentsList.innerHTML = '';
  }
}

function clearMarkers() {
  for (const marker of markers) {
    marker.setMap(null);
  }
  markers = [];
}

// Saving and loading apartments

function getSavedApartments() {
  const saved = localStorage.getItem('savedApartments');
  return saved ? JSON.parse(saved) : [];
}

function saveApartmentsToStorage(apartments) {
  localStorage.setItem('savedApartments', JSON.stringify(apartments));
}

function saveApartment(apartment) {
  const savedApartments = getSavedApartments();
  // Check for duplicates
  if (savedApartments.some(a => a.place_id === apartment.place_id)) {
    return; // Already saved
  }
  savedApartments.push(apartment);
  saveApartmentsToStorage(savedApartments);
}

// Display saved apartments
window.displaySavedApartments = function() {
  const savedList = document.getElementById('savedApartmentsList');
  savedList.innerHTML = '';

  const savedApartments = getSavedApartments();
  if (savedApartments.length === 0) {
    savedList.innerHTML = '<p>No saved apartments yet.</p>';
    return;
  }

  savedApartments.forEach(apartment => {
    const li = document.createElement('li');
    li.className = 'saved-apartment-item';

    let photoHtml = '';
    if (apartment.photo) {
      photoHtml = `<img src="${apartment.photo}" alt="${apartment.name}" />`;
    }

    let websiteHtml = '';
    if (apartment.website) {
      websiteHtml = `<a href="${apartment.website}" target="_blank">Visit Website</a>`;
    }

    li.innerHTML = `
      <strong>${apartment.name}</strong><br>
      ${apartment.vicinity || 'Address not available'}<br>
      ${photoHtml}
      ${websiteHtml}
    `;

    savedList.appendChild(li);
  });
};
