package com.mahesh.localserviceprovider.dto;

public class LoginResponseDTO {

    private String token;
    private Long id;
    private String email;
    private String role;

    // Default Constructor
    public LoginResponseDTO() {}

    // Constructor matching line 61 in UserService (token, id, email, role)
    public LoginResponseDTO(String token, Long id, String email, String role) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.role = role;
    }

    // Constructor for backwards compatibility (token, email, role)
    public LoginResponseDTO(String token, String email, String role) {
        this.token = token;
        this.email = email;
        this.role = role;
    }

    // Getters and Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}