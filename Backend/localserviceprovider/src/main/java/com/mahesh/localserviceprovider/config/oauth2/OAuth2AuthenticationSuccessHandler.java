package com.mahesh.localserviceprovider.config.oauth2;

import com.mahesh.localserviceprovider.model.User;
import com.mahesh.localserviceprovider.repository.UserRepository;
import com.mahesh.localserviceprovider.security.JwtUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public OAuth2AuthenticationSuccessHandler(JwtUtils jwtUtils,
                                              UserRepository userRepository,
                                              PasswordEncoder passwordEncoder) {
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();
        String provider = oauthToken.getAuthorizedClientRegistrationId(); // "google" or "github"

        String email = extractEmail(oAuth2User, provider);
        String name = extractName(oAuth2User, provider);

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email not found from " + provider + " OAuth provider");
        }

        // 1. Check if user exists; if not, create new user matching User entity validation constraints
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(name != null ? name : "OAuth User");
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            newUser.setPhone("0000000000");
            newUser.setRole(User.Role.CUSTOMER); // Ensure default role for social logins
            return userRepository.save(newUser);
        });

        // 2. Generate JWT token with email as subject and assigned role name
        String userRole = user.getRole() != null ? user.getRole().name() : "CUSTOMER";
        String token = jwtUtils.generateToken(user.getEmail(), userRole);

        // 3. Redirect back to React frontend route with generated JWT and Role
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/oauth2/redirect")
                .queryParam("token", token)
                .queryParam("role", userRole)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String extractEmail(OAuth2User oAuth2User, String provider) {
        Map<String, Object> attributes = oAuth2User.getAttributes();
        return (String) attributes.get("email");
    }

    private String extractName(OAuth2User oAuth2User, String provider) {
        Map<String, Object> attributes = oAuth2User.getAttributes();
        if ("github".equalsIgnoreCase(provider)) {
            return attributes.get("name") != null ? (String) attributes.get("name") : (String) attributes.get("login");
        }
        return (String) attributes.get("name");
    }
}