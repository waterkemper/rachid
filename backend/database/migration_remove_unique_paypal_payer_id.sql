-- Migration: Remove unique constraint from paypal_payer_id in subscriptions table
-- Reason: Same payer can have multiple subscriptions (e.g., expired and new one)

-- Remove unique constraint if it exists
DO $$
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'subscriptions_paypal_payer_id_key'
    ) THEN
        ALTER TABLE subscriptions 
        DROP CONSTRAINT subscriptions_paypal_payer_id_key;
        
        RAISE NOTICE 'Constraint subscriptions_paypal_payer_id_key removed successfully';
    ELSE
        RAISE NOTICE 'Constraint subscriptions_paypal_payer_id_key does not exist';
    END IF;
END $$;

-- Keep the index for performance (but not unique)
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_payer_id 
ON subscriptions(paypal_payer_id) 
WHERE paypal_payer_id IS NOT NULL;
