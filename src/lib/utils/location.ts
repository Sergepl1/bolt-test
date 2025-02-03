interface LocationSuggestion {
  place_id: number;
  display_name: string;
  formatted_name: string;
  type: string;
  lat: number;
  lon: number;
  city?: string;
  canton?: string;
}

export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}` +
      `&format=json` +
      `&countrycodes=ch` +
      `&addressdetails=1` +
      `&limit=5`
    );

    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      // Basic info
      place_id: item.place_id,
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      
      // Location details
      city: item.address?.city || item.address?.town || item.address?.village || item.address?.municipality,
      canton: item.address?.state,
      
      // Format name based on type
      formatted_name: formatLocationName(item)
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

function formatLocationName(item: any): string {
  const address = item.address;
  const parts: string[] = [];

  // Add main location name
  if (address?.city) {
    parts.push(`Stadt ${address.city}`);
  } else if (address?.town) {
    parts.push(`Stadt ${address.town}`);
  } else if (address?.village) {
    parts.push(`Dorf ${address.village}`);
  } else if (address?.municipality) {
    parts.push(`Gemeinde ${address.municipality}`);
  } else if (address?.suburb) {
    parts.push(`Stadtteil ${address.suburb}`);
  }

  // Add district if available
  if (address?.county) {
    parts.push(`Bezirk ${address.county}`);
  }

  // Add canton
  if (address?.state) {
    parts.push(`Kanton ${address.state}`);
  }

  return parts.join(', ');
}

export async function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<{
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  canton: string;
  display_name: string;
}> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    const data = await response.json();
    
    // Extract address components
    const getFirstValue = (...keys: string[]) => {
      for (const key of keys) {
        if (data.address?.[key]) return data.address[key];
      }
      return '';
    };

    const address = {
      street: getFirstValue('road', 'street', 'footway', 'path') || '',
      houseNumber: data.address?.house_number || '',
      zip: data.address?.postcode || '0000',
      city: getFirstValue('city', 'town', 'village', 'municipality') || '',
      canton: getFirstValue('state', 'canton') || 'ZH',
      display_name: data.display_name || '',
    };
    
    console.log('Geocoding response:', data);
    console.log('Extracted address:', address);
    
    return address;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return {
      street: '',
      houseNumber: '',
      zip: '0000',
      city: '',
      canton: 'ZH',
      display_name: 'Location not found',
    };
  }
}