package com.mahesh.localserviceprovider.dto;

import jakarta.validation.constraints.NotBlank;

public class CategoryDTO {

    private Long id;

    @NotBlank(message = "Category name is required")
    private String name;

    private String description;

    // Default Constructor
    public CategoryDTO() {
    }

    // Parameterized Constructor
    public CategoryDTO(Long id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}