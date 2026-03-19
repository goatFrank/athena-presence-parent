package com.athena.attendance.service;

import com.athena.common.dto.InviteLinkDTO;
import com.athena.common.dto.InviteLinkRequest;
import java.util.UUID;

public interface InviteLinkService {
    InviteLinkDTO generateInviteLink(UUID adminUserId, InviteLinkRequest request);
    InviteLinkDTO validateToken(String token);
    void useToken(String token);
}
