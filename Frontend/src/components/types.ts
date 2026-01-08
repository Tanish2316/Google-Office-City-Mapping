export interface CityAssignment {
    _id: string;
    cityId: number;
    city_name: string;
    officeId: string;
    placeId: string;      // Google placeId
}

export interface Office {
    id: string;
    name: string;
    color: string;
}

export interface ApiResponse {
    currentOfficeCities: CityAssignment[];
    otherOfficeCities: CityAssignment[];
}
