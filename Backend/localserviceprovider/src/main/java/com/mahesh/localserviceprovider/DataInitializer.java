package com.mahesh.localserviceprovider;

import com.mahesh.localserviceprovider.model.Category;
import com.mahesh.localserviceprovider.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public void run(String... args) throws Exception {
        if (categoryRepository.count() == 0) {
            categoryRepository.save(new Category("Plumbing", "Plumbing services"));
            categoryRepository.save(new Category("Electrical", "Electrical services"));
            categoryRepository.save(new Category("Cleaning", "Cleaning services"));

            System.out.println("--> Default categories created successfully!");
        }
    }
}