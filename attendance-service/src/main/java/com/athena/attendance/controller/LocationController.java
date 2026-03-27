package com.athena.attendance.controller;

import com.athena.attendance.entity.Location;
import com.athena.attendance.repository.LocationRepository;
import com.athena.common.dto.ResponseDTO;
import com.athena.common.enums.ResponseStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationRepository locationRepository;

    @GetMapping
    public ResponseEntity<ResponseDTO<List<Location>>> getMyTenantLocations(
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) Long departmentId) {
        List<Location> locations;
        if (departmentId != null) {
            locations = locationRepository.findByDepartmentId(departmentId)
                    .map(List::of)
                    .orElse(List.of());
        } else if (tenantId != null) {
            locations = locationRepository.findByTenantId(tenantId);
        } else {
            locations = locationRepository.findAll();
        }
        return ResponseEntity.ok(ResponseDTO.<List<Location>>builder()
                .status(ResponseStatus.SUCCESS)
                .payload(locations)
                .message("Locations fetched successfully")
                .build());
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ResponseDTO<Location>> getByDepartmentId(@PathVariable Long departmentId) {
        return locationRepository.findByDepartmentId(departmentId)
                .map(loc -> ResponseEntity.ok(ResponseDTO.<Location>builder()
                        .status(ResponseStatus.SUCCESS)
                        .payload(loc)
                        .message("Location found")
                        .build()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ResponseDTO<Location>> createLocation(@RequestBody Location location) {
        Location saved = locationRepository.save(location);
        return ResponseEntity.ok(ResponseDTO.<Location>builder()
                .status(ResponseStatus.SUCCESS)
                .payload(saved)
                .message("Location created successfully")
                .build());
    }
}
