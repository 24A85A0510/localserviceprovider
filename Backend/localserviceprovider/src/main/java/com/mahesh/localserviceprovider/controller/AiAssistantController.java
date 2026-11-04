package com.mahesh.localserviceprovider.controller;

import com.mahesh.localserviceprovider.dto.AiDetectionResponseDTO;
import com.mahesh.localserviceprovider.service.AiAssistantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiAssistantController {

    @Autowired
    private AiAssistantService aiAssistantService;

    // 1. Existing text-only detection endpoint
    @PostMapping("/detect")
    public ResponseEntity<AiDetectionResponseDTO> detectService(@RequestBody Map<String, String> request) {
        String problem = request.get("problem");
        String location = request.get("location");

        if (problem == null || problem.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        AiDetectionResponseDTO response = aiAssistantService.detectAndRecommend(problem, location);
        return ResponseEntity.ok(response);
    }

    // 2. Multimodal: Supports image upload, text description, or both
    @PostMapping(value = "/diagnose", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AiDetectionResponseDTO> diagnoseWithImage(
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "problem", required = false) String problem,
            @RequestParam(value = "location", required = false) String location) {

        if ((image == null || image.isEmpty()) && (problem == null || problem.trim().isEmpty())) {
            return ResponseEntity.badRequest().body(null);
        }

        try {
            byte[] imageBytes = (image != null && !image.isEmpty()) ? image.getBytes() : null;
            String mimeType = (image != null && !image.isEmpty()) ? image.getContentType() : null;

            AiDetectionResponseDTO response = aiAssistantService.detectAndRecommendWithImage(
                    problem,
                    imageBytes,
                    mimeType,
                    location
            );

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}