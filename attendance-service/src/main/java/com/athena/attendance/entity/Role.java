package com.athena.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    private String description;
}