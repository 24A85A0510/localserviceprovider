package com.mahesh.localserviceprovider.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TestController {

    // Removed home() method so Spring Boot can serve React's index.html from static resources

    @GetMapping("/api/test/protected")
    public ResponseEntity<?> testProtectedEndpoint() {
        return ResponseEntity.ok(Map.of("message", "Access granted! Your JWT is valid."));
    }
}