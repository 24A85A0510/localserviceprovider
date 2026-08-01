package com.mahesh.localserviceprovider;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing // Enables automatic populating of @CreatedDate and @LastModifiedDate fields
public class LocalserviceproviderApplication {

    public static void main(String[] args) {
        SpringApplication.run(LocalserviceproviderApplication.class, args);
    }

}