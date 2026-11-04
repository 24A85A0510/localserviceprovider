package com.mahesh.localserviceprovider.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    @Value("${resend.api.key}")
    private String resendApiKey;

    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://api.resend.com")
            .build();

    public void sendOtpEmail(String recipientEmail, String otp) {
        String htmlContent = """
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #0f172a; text-align: center; margin-bottom: 8px;">Password Reset Code</h2>
                <p style="color: #475569; font-size: 14px; text-align: center; margin-top: 0;">Use the 6-digit OTP below to reset your password. This OTP is valid for 10 minutes.</p>
                <div style="background-color: #f1f5f9; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">%s</span>
                </div>
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you did not request a password reset, you can safely ignore this email.</p>
            </div>
        """.formatted(otp);

        Map<String, Object> payload = Map.of(
                "from", "Local Service Provider <onboarding@resend.dev>",
                "to", List.of(recipientEmail),
                "subject", "Your Password Reset OTP - Local Service Provider",
                "html", htmlContent
        );

        try {
            restClient.post()
                    .uri("/emails")
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Reset OTP successfully delivered to {} via Resend HTTPS API", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to deliver email through Resend: {}", e.getMessage());
            throw new RuntimeException("Email dispatch failed: " + e.getMessage());
        }
    }
}