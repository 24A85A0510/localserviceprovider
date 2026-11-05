package com.mahesh.localserviceprovider.service;

import com.mahesh.localserviceprovider.dto.ForgotPasswordRequest;
import com.mahesh.localserviceprovider.dto.LoginRequestDTO;
import com.mahesh.localserviceprovider.dto.LoginResponseDTO;
import com.mahesh.localserviceprovider.dto.MobileOtpRequestDTO;
import com.mahesh.localserviceprovider.dto.MobileResetPasswordDTO;
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

    @Autowired
    private EmailService emailService;

    @Autowired
    private SmsService smsService;

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
        user.setProfilePic(requestDTO.getProfilePic());

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

    @Transactional
    public void generateAndSendOtp(ForgotPasswordRequest request) {
        User user = userRepository.findByEmailAndPhone(request.getEmail().trim(), request.getPhone().trim())
                .orElseThrow(() -> new IllegalArgumentException("No account found matching this email and phone combination."));

        String otp = String.format("%06d", new Random().nextInt(900000) + 100000);

        user.setResetOtp(otp);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        System.out.println("==========================================");
        System.out.println("🔐 RESET OTP FOR [" + user.getEmail() + "] IS: " + otp);
        System.out.println("==========================================");

        emailService.sendOtpEmail(user.getEmail(), otp);
    }

    @Transactional
    public void verifyOtpAndResetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmailAndPhone(request.getEmail().trim(), request.getPhone().trim())
                .orElseThrow(() -> new IllegalArgumentException("No account found matching this email and phone combination."));

        if (user.getResetOtp() == null || !user.getResetOtp().trim().equals(request.getOtp().trim())) {
            throw new IllegalArgumentException("Invalid OTP provided.");
        }

        if (user.getOtpExpiryTime() == null || user.getOtpExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetOtp(null);
        user.setOtpExpiryTime(null);

        userRepository.save(user);
    }

    // =========================================================================
    // --- FORGOT PASSWORD VIA MOBILE NUMBER ONLY (HANDLES DUPLICATES + REAL SMS) ---
    // =========================================================================

    @Transactional
    public void generateAndSendOtpByMobile(MobileOtpRequestDTO request) {
        String cleanPhone = request.getPhone().trim();

        List<User> users = userRepository.findAllByPhone(cleanPhone);
        if (users == null || users.isEmpty()) {
            throw new IllegalArgumentException("No account registered with phone number: " + cleanPhone);
        }

        // Generate a random 6-digit numeric OTP (100000 to 999999)
        String otp = String.format("%06d", new Random().nextInt(900000) + 100000);
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);

        for (User user : users) {
            user.setResetOtp(otp);
            user.setOtpExpiryTime(expiry);
        }
        userRepository.saveAll(users);

        System.out.println("=================================================");
        System.out.println("📱 MOBILE RESET OTP FOR [" + cleanPhone + "] IS: " + otp);
        System.out.println("=================================================");

        // Dispatches the actual SMS message to the phone number
        smsService.sendOtpSms(cleanPhone, otp);
    }

    @Transactional
    public void verifyOtpAndResetPasswordByMobile(MobileResetPasswordDTO request) {
        String cleanPhone = request.getPhone().trim();
        String cleanOtp = request.getOtp().trim();

        List<User> users = userRepository.findAllByPhone(cleanPhone);
        if (users == null || users.isEmpty()) {
            throw new IllegalArgumentException("No account registered with phone number: " + cleanPhone);
        }

        User primaryUser = users.get(0);

        if (primaryUser.getResetOtp() == null || !primaryUser.getResetOtp().equals(cleanOtp)) {
            throw new IllegalArgumentException("Invalid OTP provided.");
        }

        if (primaryUser.getOtpExpiryTime() == null || primaryUser.getOtpExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP has expired. Please request a new one.");
        }

        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        for (User user : users) {
            user.setPassword(encodedPassword);
            user.setResetOtp(null);
            user.setOtpExpiryTime(null);
        }
        userRepository.saveAll(users);
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