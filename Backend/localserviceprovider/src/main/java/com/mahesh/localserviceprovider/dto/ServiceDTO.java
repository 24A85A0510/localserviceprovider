package com.mahesh.localserviceprovider.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ServiceDTO {

    private Long id;

    @NotBlank(message = "Service title is required")
    private String title;

    private String description;

    @NotNull(message = "Price is required")
    private Double price;

    private String location;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String categoryName;
    private Long providerId;
    private String providerName;

    public ServiceDTO() {
    }

    public ServiceDTO(Long id, String title, String description, Double price, Long categoryId, String categoryName, Long providerId, String providerName) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.price = price;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.providerId = providerId;
        this.providerName = providerName;
    }

    public ServiceDTO(Long id, String title, String description, Double price, String location, Long categoryId, String categoryName, Long providerId, String providerName) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.price = price;
        this.location = location;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.providerId = providerId;
        this.providerName = providerName;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Long getProviderId() {
        return providerId;
    }

    public void setProviderId(Long providerId) {
        this.providerId = providerId;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }
}