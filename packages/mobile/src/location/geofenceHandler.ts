import BackgroundGeolocation from "react-native-background-geolocation";

export function setupGeofenceListener(userId: number) {
  BackgroundGeolocation.onGeofence(async (event) => {
    const { identifier, action } = event;
    const locationId = parseInt(identifier.split("-")[1], 10);

    if (action === "ENTER") {
      await fetch(`/api/users/${userId}/location-state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: "AT_LOCATION",
          location_id: locationId,
        }),
      });
    }

    if (action === "EXIT") {
      await fetch(`/api/users/${userId}/location-state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: "LEFT_LOCATION",
          location_id: locationId,
        }),
      });
    }
  });
}