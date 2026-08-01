package com.mahesh.localserviceprovider.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Skip JWT validation for CORS OPTIONS pre-flight requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = parseJwt(request);
            if (jwt != null) {
                if (jwtUtils.validateToken(jwt)) {
                    String username = jwtUtils.extractUsername(jwt);
                    String role = jwtUtils.extractRole(jwt);

                    if (role == null || role.isBlank()) {
                        role = "CUSTOMER";
                    }

                    String rawRole = role.replace("ROLE_", "").toUpperCase();

                    List<SimpleGrantedAuthority> authorities = List.of(
                            new SimpleGrantedAuthority("ROLE_" + rawRole),
                            new SimpleGrantedAuthority(rawRole)
                    );

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(username, null, authorities);

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    response.setHeader("X-JWT-Error", "Token validation returned false");
                }
            } else {
                response.setHeader("X-JWT-Error", "Parsed JWT token was null");
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: ", e);
            response.setHeader("X-JWT-Error", e.getClass().getSimpleName() + ": " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth)) {
            String trimmedHeader = headerAuth.trim();
            String token = null;

            if (trimmedHeader.startsWith("Bearer ")) {
                token = trimmedHeader.substring(7).trim();
            } else if (trimmedHeader.startsWith("Bearer")) {
                token = trimmedHeader.substring(6).trim();
            }

            if (token != null) {
                return token.replaceAll("^\"|\"$", "").trim();
            }
        }

        return null;
    }
}