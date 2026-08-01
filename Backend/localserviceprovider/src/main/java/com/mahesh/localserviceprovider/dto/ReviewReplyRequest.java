package com.mahesh.localserviceprovider.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReviewReplyRequest {

    @NotBlank(message = "Reply text cannot be blank")
    @Size(max = 1000, message = "Reply cannot exceed 1000 characters")
    private String reply;

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
}