package com.athena.common.constants;

/**
 * Constants for User Role IDs.
 * 1L: SUPERADMIN - System-wide administrative access.
 * 2L: ADMIN_TENANT - Administrative access limited to a specific tenant.
 * 3L: MANAGER - Managerial access (e.g., department level).
 * 4L: EMPLOYEE - Standard employee access.
 */
public class RoleConstants {
    public static final Long SUPERADMIN = 1L;
    public static final Long ADMIN_TENANT = 2L;
    public static final Long MANAGER = 3L;
    public static final Long EMPLOYEE = 4L;
    public static final Long MANAGER_DEMO = 5L;
    public static final Long EMPLOYEE_DEMO = 6L;

    private RoleConstants() {
        // Prevent instantiation
    }
}
