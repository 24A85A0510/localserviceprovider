package com.mahesh.localserviceprovider.dto;

import java.util.List;

public class AiDetectionResponseDTO {
    private Long matchedCategoryId;
    private String matchedCategoryName;
    private String urgency;
    private Double estimatedMinCost;
    private Double estimatedMaxCost;
    private String assistantMessage;
    private List<ServiceDTO> recommendedServices;

    public AiDetectionResponseDTO() {}

    public AiDetectionResponseDTO(Long matchedCategoryId, String matchedCategoryName, String urgency,
                                  Double estimatedMinCost, Double estimatedMaxCost,
                                  String assistantMessage, List<ServiceDTO> recommendedServices) {
        this.matchedCategoryId = matchedCategoryId;
        this.matchedCategoryName = matchedCategoryName;
        this.urgency = urgency;
        this.estimatedMinCost = estimatedMinCost;
        this.estimatedMaxCost = estimatedMaxCost;
        this.assistantMessage = assistantMessage;
        this.recommendedServices = recommendedServices;
    }

    public Long getMatchedCategoryId() { return matchedCategoryId; }
    public void setMatchedCategoryId(Long matchedCategoryId) { this.matchedCategoryId = matchedCategoryId; }

    public String getMatchedCategoryName() { return matchedCategoryName; }
    public void setMatchedCategoryName(String matchedCategoryName) { this.matchedCategoryName = matchedCategoryName; }

    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }

    public Double getEstimatedMinCost() { return estimatedMinCost; }
    public void setEstimatedMinCost(Double estimatedMinCost) { this.estimatedMinCost = estimatedMinCost; }

    public Double getEstimatedMaxCost() { return estimatedMaxCost; }
    public void setEstimatedMaxCost(Double estimatedMaxCost) { this.estimatedMaxCost = estimatedMaxCost; }

    public String getAssistantMessage() { return assistantMessage; }
    public void setAssistantMessage(String assistantMessage) { this.assistantMessage = assistantMessage; }

    public List<ServiceDTO> getRecommendedServices() { return recommendedServices; }
    public void setRecommendedServices(List<ServiceDTO> recommendedServices) { this.recommendedServices = recommendedServices; }
}