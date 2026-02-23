package com.athena.attendance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "profiles", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Profile {
    @Id
    private UUID id;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "full_name")
    private String fullName;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;
}