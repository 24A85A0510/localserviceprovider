package com.mahesh.localserviceprovider.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mahesh.localserviceprovider.dto.AiDetectionResponseDTO;
import com.mahesh.localserviceprovider.dto.ServiceDTO;
import com.mahesh.localserviceprovider.model.Category;
import com.mahesh.localserviceprovider.repository.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiAssistantService {

    private static final Logger log = LoggerFactory.getLogger(AiAssistantService.class);

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ServiceOfferingService serviceOfferingService;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public AiDetectionResponseDTO detectAndRecommend(String userQuery, String location) {
        return detectAndRecommendWithImage(userQuery, null, null, location);
    }

    public AiDetectionResponseDTO detectAndRecommendWithImage(String userQuery, byte[] imageBytes, String mimeType, String location) {
        List<Category> categories = categoryRepository.findAll();
        String availableCategories = categories.stream()
                .map(c -> String.format("{id: %d, name: \"%s\", description: \"%s\"}", c.getId(), c.getName(), c.getDescription()))
                .collect(Collectors.joining(", "));

        String promptText = String.format("""
                You are an expert AI triage assistant for an on-demand local services platform.
                Available Database Categories: [%s]
                
                Customer Query/Note: "%s"
                Customer Location: "%s"
                
                Instructions:
                1. Inspect the provided image (if any) and customer note to identify the issue (e.g., water leakage, electrical short circuit, wall damage, cleaning requirement).
                2. Match the issue strictly to the single most relevant category ID from the Available Database Categories list above.
                3. Determine urgency: "LOW", "MEDIUM", "HIGH", or "EMERGENCY".
                4. Extract 2-4 critical keywords representing the core technical problem (e.g., ["leak", "pipe", "drain", "joint"]).
                5. Provide an estimated price range in INR (estimatedMinCost and estimatedMaxCost) based on typical Indian market repair costs.
                6. Write a concise, 1-2 sentence reassuring message explaining the detected problem and recommended fix.
                
                Respond ONLY with a valid JSON object in this format (no markdown, no backticks):
                {
                  "matchedCategoryId": <id_number>,
                  "urgency": "<LOW|MEDIUM|HIGH|EMERGENCY>",
                  "keywords": ["<keyword1>", "<keyword2>"],
                  "estimatedMinCost": <number>,
                  "estimatedMaxCost": <number>,
                  "assistantMessage": "<reassuring explanation>"
                }
                """, availableCategories,
                (userQuery != null && !userQuery.isBlank()) ? userQuery : "Analyze the attached image to detect the service needed",
                (location != null && !location.isBlank()) ? location : "Not specified");

        AiDetectionResponseDTO responseDto = new AiDetectionResponseDTO();

        try {
            log.info("Calling Gemini 1.5 Flash via REST API (hasImage={}, location={})...", imageBytes != null, location);

            List<Object> partsList = new ArrayList<>();

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", promptText);
            partsList.add(textPart);

            if (imageBytes != null && imageBytes.length > 0) {
                String safeMime = (mimeType != null && !mimeType.isBlank()) ? mimeType : "image/jpeg";
                String base64Data = Base64.getEncoder().encodeToString(imageBytes);

                Map<String, Object> inlineData = new HashMap<>();
                inlineData.put("mimeType", safeMime);
                inlineData.put("data", base64Data);

                Map<String, Object> imagePart = new HashMap<>();
                imagePart.put("inlineData", inlineData);
                partsList.add(imagePart);
            }

            Map<String, Object> contentMap = new HashMap<>();
            contentMap.put("parts", partsList);

            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("contents", Collections.singletonList(contentMap));

            String requestBody = objectMapper.writeValueAsString(requestPayload);
            String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> httpResponse = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (httpResponse.statusCode() != 200) {
                throw new RuntimeException("Gemini HTTP error status: " + httpResponse.statusCode() + " body: " + httpResponse.body());
            }

            JsonNode geminiResponseNode = objectMapper.readTree(httpResponse.body());
            String rawJson = geminiResponseNode
                    .path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText()
                    .replace("```json", "")
                    .replace("```", "")
                    .trim();

            log.info("Gemini raw response: {}", rawJson);

            JsonNode rootNode = objectMapper.readTree(rawJson);
            Long categoryId = rootNode.path("matchedCategoryId").asLong();
            String urgency = rootNode.path("urgency").asText("MEDIUM");
            Double minCost = rootNode.path("estimatedMinCost").asDouble(300.0);
            Double maxCost = rootNode.path("estimatedMaxCost").asDouble(1000.0);
            String assistantMsg = rootNode.path("assistantMessage").asText("We found specialists who can help with this issue.");

            List<String> keywords = new ArrayList<>();
            if (rootNode.has("keywords") && rootNode.path("keywords").isArray()) {
                for (JsonNode kw : rootNode.path("keywords")) {
                    keywords.add(kw.asText().toLowerCase());
                }
            }

            responseDto.setMatchedCategoryId(categoryId);
            responseDto.setUrgency(urgency);
            responseDto.setEstimatedMinCost(minCost);
            responseDto.setEstimatedMaxCost(maxCost);
            responseDto.setAssistantMessage(assistantMsg);

            categories.stream()
                    .filter(c -> c.getId().equals(categoryId))
                    .findFirst()
                    .ifPresent(c -> responseDto.setMatchedCategoryName(c.getName()));

            // Fetch candidate services from database for the matched category
            Page<ServiceDTO> candidatesPage = serviceOfferingService.searchServices(
                    null, null, categoryId, null, null, 0, 20, "createdAt", "desc"
            );
            List<ServiceDTO> candidateList = new ArrayList<>(candidatesPage.getContent());

            // Rank candidates based on location proximity & keyword relevance
            List<ServiceDTO> rankedServices = rankServicesByLocationAndRelevance(candidateList, location, keywords);
            responseDto.setRecommendedServices(rankedServices);

        } catch (Exception e) {
            log.error("Gemini API call failed! Exact error: ", e);

            responseDto.setAssistantMessage("We are reviewing your request. Browse our providers below:");
            if (!categories.isEmpty()) {
                responseDto.setMatchedCategoryId(categories.get(0).getId());
                responseDto.setMatchedCategoryName(categories.get(0).getName());
            }
            responseDto.setUrgency("MEDIUM");
            responseDto.setEstimatedMinCost(300.0);
            responseDto.setEstimatedMaxCost(1000.0);

            Page<ServiceDTO> defaultServices = serviceOfferingService.getAllServices(0, 5, "createdAt", "desc");
            List<ServiceDTO> fallbackRanked = rankServicesByLocationAndRelevance(
                    new ArrayList<>(defaultServices.getContent()),
                    location,
                    Collections.emptyList()
            );
            responseDto.setRecommendedServices(fallbackRanked);
        }

        return responseDto;
    }

    /**
     * Smart Location & Relevance Ranking Engine
     * Calculates score (0 - 100%) and generates reasoning tag
     */
    private List<ServiceDTO> rankServicesByLocationAndRelevance(List<ServiceDTO> services, String targetLocation, List<String> keywords) {
        String cleanTargetLoc = (targetLocation != null) ? targetLocation.trim().toLowerCase() : "";

        for (ServiceDTO service : services) {
            int score = 30; // Base score for category match
            StringBuilder reasonBuilder = new StringBuilder();

            // 1. Location match analysis
            String serviceLoc = (service.getLocation() != null) ? service.getLocation().trim().toLowerCase() : "";
            boolean isDirectLocationMatch = false;

            if (!cleanTargetLoc.isEmpty() && !serviceLoc.isEmpty()) {
                if (serviceLoc.contains(cleanTargetLoc) || cleanTargetLoc.contains(serviceLoc)) {
                    score += 40;
                    isDirectLocationMatch = true;
                    reasonBuilder.append("📍 Exact Area Match (").append(service.getLocation()).append(")");
                } else {
                    score += 15;
                    reasonBuilder.append("📍 Serving nearby area");
                }
            } else {
                score += 20;
                reasonBuilder.append("📍 Available locally");
            }

            // 2. Keyword relevance analysis
            int keywordHits = 0;
            String titleAndDesc = ((service.getTitle() != null ? service.getTitle() : "") + " " +
                    (service.getDescription() != null ? service.getDescription() : "")).toLowerCase();

            for (String kw : keywords) {
                if (titleAndDesc.contains(kw)) {
                    keywordHits++;
                }
            }

            if (keywordHits > 0) {
                int keywordBonus = Math.min(keywordHits * 15, 30);
                score += keywordBonus;
                if (reasonBuilder.length() > 0) reasonBuilder.append(" • ");
                reasonBuilder.append("⚡ Issue Specialist");
            }

            // Bound score between 50 and 99
            int finalScore = Math.min(score, 99);
            service.setMatchScore(finalScore);
            service.setMatchReason(reasonBuilder.toString());
        }

        // Sort descending: highest match score first, limit to top 5
        return services.stream()
                .sorted(Comparator.comparing(ServiceDTO::getMatchScore, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .collect(Collectors.toList());
    }
}