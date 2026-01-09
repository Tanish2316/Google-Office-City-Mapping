export async function getPlaceName(
  map: google.maps.Map,
  placeId: string
): Promise<string | null> {
  return new Promise((resolve) => {
    const service = new google.maps.places.PlacesService(map);

    service.getDetails(
      { placeId, fields: ["name", "address_components"] },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place?.address_components
        ) {
          const name = place.address_components
            .map(c => c.long_name)
            .join(", ");
          resolve(name);
        } else {
          resolve(null);
        }
      }
    );
  });
}
