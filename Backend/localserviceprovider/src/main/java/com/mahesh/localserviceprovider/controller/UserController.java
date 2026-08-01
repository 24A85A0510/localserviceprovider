package com.mahesh.localserviceprovider.controller;

import com.mahesh.localserviceprovider.dto.UserRequestDTO;
import com.mahesh.localserviceprovider.dto.UserResponseDTO;
import com.mahesh.localserviceprovider.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<UserResponseDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody UserRequestDTO userRequestDTO) {
        try {
            UserResponseDTO createdUser = userService.createUser(userRequestDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // --- ADDED: GET /api/users/{id} ---
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            UserResponseDTO user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // --- ADDED: PUT /api/users/{id} ---
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserRequestDTO userRequestDTO) {
        try {
            UserResponseDTO updatedUser = userService.updateUser(id, userRequestDTO);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}