package com.mahesh.localserviceprovider.service;

import com.mahesh.localserviceprovider.dto.CategoryDTO;
import com.mahesh.localserviceprovider.model.Category;
import com.mahesh.localserviceprovider.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public CategoryDTO createCategory(CategoryDTO dto) {
        if (categoryRepository.findByName(dto.getName()).isPresent()) {
            throw new RuntimeException("Category already exists with name: " + dto.getName());
        }

        Category category = new Category(dto.getName(), dto.getDescription());
        Category saved = categoryRepository.save(category);

        return new CategoryDTO(saved.getId(), saved.getName(), saved.getDescription());
    }

    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(c -> new CategoryDTO(c.getId(), c.getName(), c.getDescription()))
                .collect(Collectors.toList());
    }
}