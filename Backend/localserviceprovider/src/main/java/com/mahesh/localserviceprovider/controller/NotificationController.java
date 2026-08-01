package com.mahesh.localserviceprovider.controller;

import com.mahesh.localserviceprovider.model.Notification;
import com.mahesh.localserviceprovider.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    // GET /api/notifications/user/{userId}
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable("userId") Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByIdDesc(userId);
        return ResponseEntity.ok(notifications);
    }

    // GET /api/notifications/user/{userId}/unread
    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<Long> getUnreadCount(@PathVariable("userId") Long userId) {
        Long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);
        return ResponseEntity.ok(unreadCount);
    }

    // PATCH /api/notifications/{id}/read
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable("id") Long id) {
        notificationRepository.findById(id).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
        return ResponseEntity.ok().build();
    }
}