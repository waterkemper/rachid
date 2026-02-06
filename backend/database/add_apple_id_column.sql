-- Migration: Add apple_id column to usuarios table for Apple Sign In support
-- Run this script on your database to enable Apple Sign In

-- Add the apple_id column
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS apple_id VARCHAR(255) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_usuarios_apple_id ON usuarios(apple_id);

