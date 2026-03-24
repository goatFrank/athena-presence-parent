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

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM InviteLink i WHERE i.senderId = :userId OR i.managerId = :userId")
    void deleteBySenderIdOrManagerId(@org.springframework.data.repository.query.Param("userId") java.util.UUID userId);
}
