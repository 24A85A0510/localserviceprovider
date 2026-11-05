package com.mahesh.localserviceprovider.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class SmsService {

    // You can set this in application.properties or paste your free Fast2SMS API key here
    @Value("${sms.api.key:YOUR_FAST2SMS_API_KEY}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendOtpSms(String mobileNumber, String otp) {
        String cleanPhone = mobileNumber.replaceAll("[^0-9]", "");
        if (cleanPhone.length() > 10) {
            cleanPhone = cleanPhone.substring(cleanPhone.length() - 10);
        }

        try {
            String url = "https://www.fast2sms.com/dev/bulkV2";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("authorization", apiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("route", "otp");
            body.put("variables_values", otp);
            body.put("numbers", cleanPhone);

            HttpEntity<?> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            System.out.println("Fast2SMS API Response: " + response.getBody());
        } catch (Exception e) {
            System.err.println("Failed to dispatch real SMS via Fast2SMS: " + e.getMessage());
            System.out.println("Fallback Console OTP for [" + cleanPhone + "] is: " + otp);
        }
    }
}