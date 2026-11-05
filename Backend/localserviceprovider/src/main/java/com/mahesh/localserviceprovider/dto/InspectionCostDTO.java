package com.mahesh.localserviceprovider.dto;

public class InspectionCostDTO {

    private Long serviceId;
    private String serviceTitle;
    private Double baseInspectionFee;
    private Double distanceKm;
    private Double freeDistanceKm;
    private Double billableKm;
    private Double perKmRate;
    private Double travelSurcharge;
    private Double totalVisitingAmount;

    public InspectionCostDTO() {}

    public InspectionCostDTO(Long serviceId, String serviceTitle, Double baseInspectionFee,
                             Double distanceKm, Double freeDistanceKm, Double billableKm,
                             Double perKmRate, Double travelSurcharge, Double totalVisitingAmount) {
        this.serviceId = serviceId;
        this.serviceTitle = serviceTitle;
        this.baseInspectionFee = baseInspectionFee;
        this.distanceKm = distanceKm;
        this.freeDistanceKm = freeDistanceKm;
        this.billableKm = billableKm;
        this.perKmRate = perKmRate;
        this.travelSurcharge = travelSurcharge;
        this.totalVisitingAmount = totalVisitingAmount;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceTitle() {
        return serviceTitle;
    }

    public void setServiceTitle(String serviceTitle) {
        this.serviceTitle = serviceTitle;
    }

    public Double getBaseInspectionFee() {
        return baseInspectionFee;
    }

    public void setBaseInspectionFee(Double baseInspectionFee) {
        this.baseInspectionFee = baseInspectionFee;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Double getFreeDistanceKm() {
        return freeDistanceKm;
    }

    public void setFreeDistanceKm(Double freeDistanceKm) {
        this.freeDistanceKm = freeDistanceKm;
    }

    public Double getBillableKm() {
        return billableKm;
    }

    public void setBillableKm(Double billableKm) {
        this.billableKm = billableKm;
    }

    public Double getPerKmRate() {
        return perKmRate;
    }

    public void setPerKmRate(Double perKmRate) {
        this.perKmRate = perKmRate;
    }

    public Double getTravelSurcharge() {
        return travelSurcharge;
    }

    public void setTravelSurcharge(Double travelSurcharge) {
        this.travelSurcharge = travelSurcharge;
    }

    public Double getTotalVisitingAmount() {
        return totalVisitingAmount;
    }

    public void setTotalVisitingAmount(Double totalVisitingAmount) {
        this.totalVisitingAmount = totalVisitingAmount;
    }
}