package com.mahesh.localserviceprovider.config;

import com.mahesh.localserviceprovider.model.User;
import com.mahesh.localserviceprovider.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminDataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = "admin@example.com";

        // Check if an admin account already exists; if not, create one automatically
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode("admin123")); // Securely encrypts password
            admin.setPhone("9999999999");
            admin.setRole(User.Role.ADMIN);

            userRepository.save(admin);
            System.out.println("✅ Default Admin account initialized: admin@example.com / admin123");
        }
    }
}