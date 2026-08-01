package com.mahesh.localserviceprovider.controller;

import com.mahesh.localserviceprovider.dto.ForgotPasswordRequest;
import com.mahesh.localserviceprovider.dto.LoginRequestDTO;
import com.mahesh.localserviceprovider.dto.ResetPasswordRequest;
import com.mahesh.localserviceprovider.dto.UserRequestDTO;
import com.mahesh.localserviceprovider.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRequestDTO userDTO) {
        try {
            return ResponseEntity.ok(userService.createUser(userDTO));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO loginDTO) {
        try {
            return ResponseEntity.ok(userService.loginUser(loginDTO));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> requestOtp(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            userService.generateAndSendOtp(request);
            return ResponseEntity.ok("OTP sent successfully to your registered phone number.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            userService.verifyOtpAndResetPassword(request);
            return ResponseEntity.ok("Password reset successfully. You can now log in with your new password.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}