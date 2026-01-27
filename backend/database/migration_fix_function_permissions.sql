-- Migration: Fix PostgreSQL function permissions
-- Revokes public and anon access from all functions to prevent unauthorized execution
-- Functions should only be executable by the database owner/service role

-- Revoke public access from trigger functions
-- These functions are only called by triggers, not directly by users

-- Fix update_plan_limits_updated_at function
REVOKE EXECUTE ON FUNCTION update_plan_limits_updated_at() FROM public;
REVOKE EXECUTE ON FUNCTION update_plan_limits_updated_at() FROM anon;

-- Fix update_plans_updated_at function
REVOKE EXECUTE ON FUNCTION update_plans_updated_at() FROM public;
REVOKE EXECUTE ON FUNCTION update_plans_updated_at() FROM anon;

-- Fix update_promo_codes_updated_at function
REVOKE EXECUTE ON FUNCTION update_promo_codes_updated_at() FROM public;
REVOKE EXECUTE ON FUNCTION update_promo_codes_updated_at() FROM anon;

-- Fix update_subscriptions_updated_at function
REVOKE EXECUTE ON FUNCTION update_subscriptions_updated_at() FROM public;
REVOKE EXECUTE ON FUNCTION update_subscriptions_updated_at() FROM anon;

-- Fix update_subscription_features_updated_at function
REVOKE EXECUTE ON FUNCTION update_subscription_features_updated_at() FROM public;
REVOKE EXECUTE ON FUNCTION update_subscription_features_updated_at() FROM anon;

-- Note: These functions are trigger functions and should only be called by PostgreSQL triggers
-- The database owner (service role) retains execute permissions by default
-- If you need to explicitly grant to a service role, uncomment and adjust:
-- GRANT EXECUTE ON FUNCTION update_plan_limits_updated_at() TO service_role;
-- GRANT EXECUTE ON FUNCTION update_plans_updated_at() TO service_role;
-- GRANT EXECUTE ON FUNCTION update_promo_codes_updated_at() TO service_role;
-- GRANT EXECUTE ON FUNCTION update_subscriptions_updated_at() TO service_role;
-- GRANT EXECUTE ON FUNCTION update_subscription_features_updated_at() TO service_role;
