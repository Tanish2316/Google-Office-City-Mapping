// Helper function to check if point is inside polygon using ray casting algorithm
const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];

        const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

// Check if city boundary is a subset of office boundary
const isBoundarySubset = (officeBoundary: any, cityBoundary: any): boolean => {
    if (!officeBoundary?.geometry?.coordinates || !cityBoundary?.geometry?.coordinates) {
        return false;
    }

    const officeCoords = officeBoundary.geometry.coordinates[0];
    const cityCoords = cityBoundary.geometry.coordinates[0];

    return cityCoords.every((point: [number, number]) =>
        isPointInPolygon(point, officeCoords)
    );
};

// Helper function to convert viewport to polygon coordinates
const viewportToPolygon = (viewport: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } }): [number, number][] => {
    const { northeast, southwest } = viewport;
    return [
        [southwest.lng, southwest.lat],
        [northeast.lng, southwest.lat],
        [northeast.lng, northeast.lat],
        [southwest.lng, northeast.lat],
        [southwest.lng, southwest.lat]
    ];
};

// Test with dynamic viewport data
export const testWithViewportDetails = (officeViewport: any, cityViewport: any) => {
    const officeBoundary = {
        geometry: {
            coordinates: [viewportToPolygon(officeViewport)]
        }
    };

    const cityBoundary = {
        geometry: {
            coordinates: [viewportToPolygon(cityViewport)]
        }
    };

    const result = isBoundarySubset(officeBoundary, cityBoundary);
    console.log('Is city within office?', result);
    return result;
};

// Example usage with actual viewport data
export const testWithActualViewport = () => {
    const officeViewport = {
        northeast: { lat: 24.0097800465674, lng: 75.87829995853478 },
        southwest: { lat: 23.9875499468295, lng: 75.84515001642416 }
    };

    const cityViewport = {
        northeast: { lat: 24.0050, lng: 75.8700 },
        southwest: { lat: 23.9900, lng: 75.8550 }
    };

    return testWithViewportDetails(officeViewport, cityViewport);
};

// Example test: Gujarat (office) and Ahmedabad (city)
// export const testGujaratAhmedabad = () => {
//     // Simplified boundary data (approximate coordinates)
//     const gujaratBoundary = {
//         geometry: {
//             coordinates: [[
//                 [68.1, 21.0], [74.5, 21.0], [74.5, 24.9], [68.1, 24.9], [68.1, 21.0]
//             ]]
//         }
//     };

//     const ahmedabadBoundary = {
//         geometry: {
//             coordinates: [[
//                 [72.5, 23.0], [72.7, 23.0], [72.7, 23.3], [72.5, 23.3], [72.5, 23.0]
//             ]]
//         }
//     };

//     const result = isBoundarySubset(gujaratBoundary, ahmedabadBoundary);
//     console.log('Is Ahmedabad within Gujarat?', result); // Should return true
//     return result;
// };

// // Run test
// if (typeof window !== 'undefined') {
//     console.log('=== Testing Boundary Subset Logic ===');
//     testGujaratAhmedabad();
//     console.log('====================================');
// }

// // Export function to call tests from anywhere
// export const runBoundaryTest = (testName: string = 'gujaratAhmedabad') => {
//     console.log(`\n=== Running Test: ${testName} ===`);

//     switch (testName) {
//         case 'gujaratAhmedabad':
//             testGujaratAhmedabad();
//             break;
//         default:
//             console.log('Test not found');
//     }

//     console.log('====================================\n');
// };
