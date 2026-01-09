export async function fetchBoundary(placeName: string) {
    const url = `https://nominatim.openstreetmap.org/search?format=geojson&q=${encodeURIComponent(
        placeName
    )}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.features?.length) {
        throw new Error("Boundary not found");
    }

    return data.features[0];
}
