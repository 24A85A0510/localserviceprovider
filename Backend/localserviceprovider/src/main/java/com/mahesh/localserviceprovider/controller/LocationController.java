package com.mahesh.localserviceprovider.controller;

import com.mahesh.localserviceprovider.dto.LocationPayload;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class LocationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Handles incoming location updates from Provider and broadcasts to Customer
    @MessageMapping("/update-location")
    public void updateLocation(LocationPayload payload) {
        System.out.println("📍 Location update for Booking [" + payload.getBookingId() + "]: "
                + payload.getLatitude() + ", " + payload.getLongitude());

        // Broadcasts to all subscribers watching topic /topic/booking/{bookingId}
        messagingTemplate.convertAndSend("/topic/booking/" + payload.getBookingId(), payload);
    }
}