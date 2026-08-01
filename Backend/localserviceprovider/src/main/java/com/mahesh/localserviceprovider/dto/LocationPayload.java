package com.mahesh.localserviceprovider.dto;

public class LocationPayload {

    private Long bookingId;
    private double latitude;
    private double longitude;

    public LocationPayload() {}

    public LocationPayload(Long bookingId, double latitude, double longitude) {
        this.bookingId = bookingId;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
}