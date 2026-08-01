package com.mahesh.localserviceprovider.model;

import com.mahesh.localserviceprovider.entity.BaseEntity;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "services")
public class ServiceEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private Double price;

    private String location;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false; // Soft-delete flag

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne
    @JoinColumn(name = "provider_id", nullable = false)
    private User provider;

    // --- Cascade Delete for Associated Bookings ---
    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Booking> bookings;

    public ServiceEntity() {
    }

    public ServiceEntity(String title, String description, Double price, Category category, User provider) {
        this.title = title;
        this.description = description;
        this.price = price;
        this.category = category;
        this.provider = provider;
        this.isDeleted = false;
    }

    public ServiceEntity(String title, String description, Double price, String location, Category category, User provider) {
        this.title = title;
        this.description = description;
        this.price = price;
        this.location = location;
        this.category = category;
        this.provider = provider;
        this.isDeleted = false;
    }

    // --- Getters and Setters ---

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

    // --- SOFT DELETE GETTER & SETTER ---
    public boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public User getProvider() {
        return provider;
    }

    public void setProvider(User provider) {
        this.provider = provider;
    }

    public List<Booking> getBookings() {
        return bookings;
    }

    public void setBookings(List<Booking> bookings) {
        this.bookings = bookings;
    }
}