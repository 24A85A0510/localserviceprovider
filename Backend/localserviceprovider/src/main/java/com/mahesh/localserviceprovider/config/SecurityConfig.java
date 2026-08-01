package com.mahesh.localserviceprovider.config;

import com.mahesh.localserviceprovider.config.oauth2.OAuth2AuthenticationSuccessHandler;
import com.mahesh.localserviceprovider.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final OAuth2AuthenticationSuccessHandler oAuth2SuccessHandler;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter,
                          OAuth2AuthenticationSuccessHandler oAuth2SuccessHandler) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Prevent 302 redirects for unauthenticated REST API calls
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                )

                .authorizeHttpRequests(auth -> auth
                        // Allow all CORS pre-flight OPTIONS requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 1. Static Assets & Swagger / System Endpoints
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/static/**",
                                "/assets/**",
                                "/*.ico",
                                "/*.json",
                                "/*.png",
                                "/*.svg",
                                "/api/auth/**",
                                "/oauth2/**",
                                "/login/oauth2/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/ws/**",
                                "/ws-location/**"
                        ).permitAll()

                        // 2. React SPA Client-Side Navigation Routes
                        // Allows the browser to reload on non-API paths without getting a 401
                        .requestMatchers(HttpMethod.GET,
                                "/login",
                                "/register",
                                "/services/**",
                                "/booking/**",
                                "/provider/**",
                                "/admin/**",
                                "/dashboard/**",
                                "/profile/**",
                                "/my-bookings/**"
                        ).permitAll()

                        // 3. Public GET APIs
                        .requestMatchers(HttpMethod.GET, "/api/services/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()

                        // 4. Admin-Only Endpoints
                        .requestMatchers("/api/admin/**").hasAnyAuthority("ROLE_ADMIN", "ADMIN")

                        // 5. Provider Reply to Review
                        .requestMatchers(HttpMethod.POST, "/api/reviews/*/reply").hasAnyAuthority("ROLE_PROVIDER", "PROVIDER")

                        // 6. Customer-only Endpoints
                        .requestMatchers(HttpMethod.POST, "/api/bookings/**").hasAnyAuthority("ROLE_CUSTOMER", "CUSTOMER")
                        .requestMatchers("/api/bookings/customer/**").hasAnyAuthority("ROLE_CUSTOMER", "CUSTOMER")
                        .requestMatchers(HttpMethod.POST, "/api/reviews/**").hasAnyAuthority("ROLE_CUSTOMER", "CUSTOMER")

                        // 7. Booking Status Updates
                        .requestMatchers(HttpMethod.PUT, "/api/bookings/*/status").hasAnyAuthority("ROLE_CUSTOMER", "CUSTOMER", "ROLE_PROVIDER", "PROVIDER")
                        .requestMatchers("/api/bookings/provider/**").hasAnyAuthority("ROLE_PROVIDER", "PROVIDER")

                        // 8. Service & Category Management
                        .requestMatchers(HttpMethod.POST, "/api/categories/**").hasAnyAuthority("ROLE_ADMIN", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/services/**").hasAnyAuthority("ROLE_PROVIDER", "PROVIDER", "ROLE_ADMIN", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/services/**").hasAnyAuthority("ROLE_PROVIDER", "PROVIDER", "ROLE_ADMIN", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/services/**").hasAnyAuthority("ROLE_PROVIDER", "PROVIDER", "ROLE_ADMIN", "ADMIN")

                        // 9. Notification Endpoints
                        .requestMatchers("/api/notifications/**").authenticated()

                        // 10. All other requests
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "https://localserviceprovider.onrender.com"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With", "X-JWT-Error"));
        configuration.setExposedHeaders(List.of("Authorization", "X-JWT-Error"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}