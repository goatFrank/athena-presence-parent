-- Migration to add invite_links table and update profiles with manager_id

CREATE TABLE IF NOT EXISTS public.invite_links (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    tenant_id BIGINT NOT NULL,
    sender_id UUID NOT NULL,
    manager_id UUID,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Add manager_id to profiles table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='manager_id') THEN
        ALTER TABLE public.profiles ADD COLUMN manager_id UUID;
    END IF;
END $$;
