package com.athena.attendance.repository;

import com.athena.attendance.entity.InviteLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InviteLinkRepository extends JpaRepository<InviteLink, Long> {
    Optional<InviteLink> findByToken(String token);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT i FROM InviteLink i WHERE i.token = :token")
    Optional<InviteLink> findWithLockByToken(String token);
}
