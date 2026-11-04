package com.mahesh.localserviceprovider.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendOtpEmail(String recipientEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("Your Password Reset OTP - Local Service Provider");

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

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Reset OTP email successfully dispatched to {}", recipientEmail);

        } catch (MessagingException e) {
            log.error("Failed to send OTP email to {}: {}", recipientEmail, e.getMessage());
            throw new RuntimeException("Failed to send OTP email. Please try again.");
        }
    }
}