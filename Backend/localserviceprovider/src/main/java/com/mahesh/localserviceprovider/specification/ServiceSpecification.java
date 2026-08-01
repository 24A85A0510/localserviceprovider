package com.mahesh.localserviceprovider.specification;

import com.mahesh.localserviceprovider.model.ServiceEntity;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ServiceSpecification {

    public static Specification<ServiceEntity> filterServices(
            String keyword,
            String location,
            Long categoryId,
            Double minPrice,
            Double maxPrice
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filter out soft-deleted items globally
            predicates.add(cb.equal(root.get("isDeleted"), false));

            // Keyword Filter (Title or Description)
            if (keyword != null && !keyword.trim().isEmpty()) {
                String likePattern = "%" + keyword.toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), likePattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), likePattern);
                predicates.add(cb.or(titleLike, descLike));
            }

            // Location Filter (City / Address match)
            if (location != null && !location.trim().isEmpty()) {
                String locationPattern = "%" + location.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("location")), locationPattern));
            }

            // Category Filter
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            // Price Range Filters
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}