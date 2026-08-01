package com.mahesh.localserviceprovider.model;

import com.mahesh.localserviceprovider.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Email is required")
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Column(nullable = false)
    private String password;

    @NotBlank(message = "Phone number is required")
    @Column(nullable = false, length = 15)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // --- OTP Reset Fields ---
    @Column(name = "reset_otp")
    private String resetOtp;

    @Column(name = "otp_expiry_time")
    private LocalDateTime otpExpiryTime;

    // --- Cascade Relationships to Prevent FK Errors on Delete ---

    // Deletes all services created by this provider when the user is deleted
    @OneToMany(mappedBy = "provider", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceEntity> services;

    // Deletes all bookings made by this customer when the user is deleted
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Booking> bookings;

    public enum Role {
        CUSTOMER,
        PROVIDER,
        ADMIN
    }

    // Default Constructor
    public User() {}

    // Parameterized Constructor
    public User(Long id, String name, String email, String password, String phone, Role role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.role = role;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getResetOtp() {
        return resetOtp;
    }

    public void setResetOtp(String resetOtp) {
        this.resetOtp = resetOtp;
    }

    public LocalDateTime getOtpExpiryTime() {
        return otpExpiryTime;
    }

    public void setOtpExpiryTime(LocalDateTime otpExpiryTime) {
        this.otpExpiryTime = otpExpiryTime;
    }

    public List<ServiceEntity> getServices() {
        return services;
    }

    public void setServices(List<ServiceEntity> services) {
        this.services = services;
    }

    public List<Booking> getBookings() {
        return bookings;
    }

    public void setBookings(List<Booking> bookings) {
        this.bookings = bookings;
    }
}