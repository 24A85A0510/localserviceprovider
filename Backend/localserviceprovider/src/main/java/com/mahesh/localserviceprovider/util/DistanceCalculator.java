package com.mahesh.localserviceprovider.util;

public class DistanceCalculator {

    private static final int EARTH_RADIUS_KM = 6371;

    /**
     * Calculates great-circle distance between two points on Earth using Haversine formula.
     */
    public static double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = EARTH_RADIUS_KM * c;

        // Round to 2 decimal places
        return Math.round(distance * 100.0) / 100.0;
    }

    /**
     * Calculates billable extra distance beyond the free radius.
     */
    public static double calculateBillableKm(double actualDistanceKm, double freeDistanceKm) {
        double extra = actualDistanceKm - freeDistanceKm;
        return extra > 0 ? Math.round(extra * 100.0) / 100.0 : 0.0;
    }

    /**
     * Calculates travel surcharge based on billable distance and rate.
     */
    public static double calculateTravelSurcharge(double billableKm, double perKmRate) {
        return Math.round(billableKm * perKmRate * 100.0) / 100.0;
    }
}