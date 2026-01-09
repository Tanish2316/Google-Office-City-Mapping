import * as turf from "@turf/turf";

export function isBoundaryInside(
    parentBoundary: any,
    childBoundary: any
): boolean {
    return turf.booleanContains(parentBoundary, childBoundary);
}
