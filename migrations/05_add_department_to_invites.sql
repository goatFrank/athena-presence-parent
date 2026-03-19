-- Add department_id to invite_links table for optional department assignment
ALTER TABLE invite_links ADD COLUMN department_id BIGINT;

-- Add comment
COMMENT ON COLUMN invite_links.department_id IS 'Optional department ID to be assigned to the user upon registration';
