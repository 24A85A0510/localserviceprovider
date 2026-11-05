package com.mahesh.localserviceprovider.repository;

import com.mahesh.localserviceprovider.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Find a user by their email address
    Optional<User> findByEmail(String email);

    // Find all users matching a phone number (prevents NonUniqueResultException if duplicates exist)
    List<User> findAllByPhone(String phone);

    // Check if an email already exists in the database
    boolean existsByEmail(String email);

    // Find a user by matching both email and phone
    Optional<User> findByEmailAndPhone(String email, String phone);

    // Check if a phone number exists in the database
    boolean existsByPhone(String phone);
}