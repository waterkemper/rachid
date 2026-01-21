-- Migration: Add trial_days column to plans table
-- Adds support for trial periods (7 days free trial by default)
-- Run this migration if trial_days column doesn't exist yet

-- Check if column exists before adding (PostgreSQL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'plans' 
        AND column_name = 'trial_days'
    ) THEN
        ALTER TABLE plans 
        ADD COLUMN trial_days INTEGER DEFAULT 0;
        
        -- Set default trial of 7 days for existing MONTHLY and YEARLY plans
        UPDATE plans 
        SET trial_days = 7 
        WHERE plan_type IN ('MONTHLY', 'YEARLY') 
        AND is_one_time = false;
        
        -- Add comment
        COMMENT ON COLUMN plans.trial_days IS 'Trial period in days (0 = no trial, default 7 days)';
    END IF;
END $$;
