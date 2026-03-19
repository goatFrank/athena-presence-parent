package com.athena.attendance.repository;

import com.athena.attendance.entity.InviteLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InviteLinkRepository extends JpaRepository<InviteLink, Long> {
    Optional<InviteLink> findByToken(String token);
}
