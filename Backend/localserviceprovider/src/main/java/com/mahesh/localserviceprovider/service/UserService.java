package com.mahesh.localserviceprovider.service;

import com.mahesh.localserviceprovider.dto.ForgotPasswordRequest;
import com.mahesh.localserviceprovider.dto.LoginRequestDTO;
import com.mahesh.localserviceprovider.dto.LoginResponseDTO;
import com.mahesh.localserviceprovider.dto.ResetPasswordRequest;
import com.mahesh.localserviceprovider.dto.UserRequestDTO;
import com.mahesh.localserviceprovider.dto.UserResponseDTO;
import com.mahesh.localserviceprovider.model.User;
import com.mahesh.localserviceprovider.repository.UserRepository;
import com.mahesh.localserviceprovider.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    public UserResponseDTO createUser(UserRequestDTO requestDTO) {
        String cleanEmail = requestDTO.getEmail() != null ? requestDTO.getEmail().trim() : "";

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("Error: Email is already in use!");
        }

        User user = new User();
        user.setName(requestDTO.getName());
        user.setEmail(cleanEmail);
        user.setPassword(passwordEncoder.encode(requestDTO.getPassword()));
        user.setPhone(requestDTO.getPhone() != null ? requestDTO.getPhone().trim() : null);
        user.setRole(requestDTO.getRole());
        user.setProfilePic(requestDTO.getProfilePic()); // Save profilePic on creation

        User savedUser = userRepository.save(user);
        return convertToResponseDTO(savedUser);
    }

    public LoginResponseDTO loginUser(LoginRequestDTO loginDTO) {
        if (loginDTO.getEmail() == null || loginDTO.getPassword() == null) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String cleanEmail = loginDTO.getEmail().trim();

        // 1. Fetch user by trimmed email
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        // 2. Verify hashed password
        if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // 3. Extract Role safely (fallback to CUSTOMER if null)
        String roleName = (user.getRole() != null) ? user.getRole().name() : "CUSTOMER";

        // 4. Generate JWT
        String token = jwtUtils.generateToken(user.getEmail(), roleName);

        return new LoginResponseDTO(token, user.getId(), user.getEmail(), roleName);
    }

    // --- GET USER BY ID ---
    public UserResponseDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));
        return convertToResponseDTO(user);
    }

    // --- UPDATE USER PROFILE ---
    public UserResponseDTO updateUser(Long id, UserRequestDTO requestDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

        // Update name
        if (requestDTO.getName() != null && !requestDTO.getName().trim().isEmpty()) {
            user.setName(requestDTO.getName().trim());
        }

        // Update email with validation
        if (requestDTO.getEmail() != null) {
            String cleanEmail = requestDTO.getEmail().trim();
            if (!cleanEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmail(cleanEmail)) {
                    throw new IllegalArgumentException("Error: Email is already in use!");
                }
                user.setEmail(cleanEmail);
            }
        }

        // Update phone
        if (requestDTO.getPhone() != null) {
            user.setPhone(requestDTO.getPhone().trim());
        }

        // Update password if provided
        if (requestDTO.getPassword() != null && !requestDTO.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(requestDTO.getPassword()));
        }

        // Update profile picture
        if (requestDTO.getProfilePic() != null) {
            user.setProfilePic(requestDTO.getProfilePic());
        }

        User updatedUser = userRepository.save(user);
        return convertToResponseDTO(updatedUser);
    }

    // --- DELETE USER BY ID (Transactional Cascade) ---
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));
        userRepository.delete(user);
    }

    // =========================================================================
    // --- FORGOT PASSWORD & OTP WORKFLOW (EXACT EMAIL + PHONE MATCH) ---
    // =========================================================================

    // 1. Generate & Save 6-digit OTP
    @Transactional
    public void generateAndSendOtp(ForgotPasswordRequest request) {
        User user = userRepository.findByEmailAndPhone(request.getEmail().trim(), request.getPhone().trim())
                .orElseThrow(() -> new IllegalArgumentException("No account found matching this email and phone combination."));

        // Generate a random 6-digit OTP (100000 to 999999)
        String otp = String.format("%06d", new Random().nextInt(900000) + 100000);

        // Set OTP and 10-minute expiry time
        user.setResetOtp(otp);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        // Console logger
        System.out.println("==========================================");
        System.out.println("🔐 RESET OTP FOR [" + user.getEmail() + "] IS: " + otp);
        System.out.println("==========================================");
    }

    // 2. Verify OTP & Update Password
    @Transactional
    public void verifyOtpAndResetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmailAndPhone(request.getEmail().trim(), request.getPhone().trim())
                .orElseThrow(() -> new IllegalArgumentException("No account found matching this email and phone combination."));

        // Check if OTP exists and matches
        if (user.getResetOtp() == null || !user.getResetOtp().trim().equals(request.getOtp().trim())) {
            throw new IllegalArgumentException("Invalid OTP provided.");
        }

        // Check if OTP has expired
        if (user.getOtpExpiryTime() == null || user.getOtpExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP has expired. Please request a new one.");
        }

        // Hash new password and clear OTP fields
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetOtp(null);
        user.setOtpExpiryTime(null);

        userRepository.save(user);
    }

    private UserResponseDTO convertToResponseDTO(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getProfilePic()
        );
    }
}