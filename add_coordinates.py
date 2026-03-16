import json
from geopy.geocoders import Nominatim
from time import sleep


def get_coordinates(location_name):
    """
    Converts a location name to its latitude and longitude coordinates.
    """
    geolocator = Nominatim(user_agent="my_application")
    location = geolocator.geocode(location_name)

    if location:
        return location.latitude, location.longitude
    else:
        return None, None


def enrich_with_coordinates(input_file, output_file):
    with open(input_file, "r") as f:
        data = json.load(f)

    for entry in data:
        enriched_locations = []

        for location_name in entry.get("locations", []):
            lat, lon = get_coordinates(location_name)

            enriched_locations.append({
                "name": location_name,
                "latitude": lat,
                "longitude": lon
            })

            # Nominatim requires a 1-second delay between requests
            sleep(1)

        entry["locations"] = enriched_locations

    with open(output_file, "w") as f:
        json.dump(data, f, indent=4)

    print(f"Enriched data saved to '{output_file}'")


if __name__ == "__main__":
    enrich_with_coordinates("complaint_data.json", "complaint_data_with_coords.json")
