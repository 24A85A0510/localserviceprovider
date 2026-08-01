package com.mahesh.localserviceprovider.repository;

import com.mahesh.localserviceprovider.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByIdDesc(Long userId);

    Long countByUserIdAndIsReadFalse(Long userId);
}