-- ============================================================================
-- Migration 002: Security and Row-Level Security (RLS)
-- Project: Smart Appointment & Consultation Booking Platform
-- Description: Enables RLS on all tables, defines granular read/write policies
--              for public catalog exploration and strict user data privacy.
-- ============================================================================

-- 1. Enable RLS Across All Domain Tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Policies: services
-- Public / clients can browse active services. Administrators manage catalog.
-- ============================================================================
CREATE POLICY "Public users can view active services"
    ON services FOR SELECT
    USING (is_active = true);

CREATE POLICY "Service role has full access to services"
    ON services FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Policies: specialists
-- Public can browse active specialist profiles.
-- Specialists can manage their own profile once authenticated.
-- ============================================================================
CREATE POLICY "Public users can view active specialists"
    ON specialists FOR SELECT
    USING (is_active = true);

CREATE POLICY "Specialists can update their own profile"
    ON specialists FOR UPDATE
    TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Service role has full access to specialists"
    ON specialists FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Policies: clients
-- Protect personal data. Clients can only see and update their own record.
-- Insertion allowed during registration.
-- ============================================================================
CREATE POLICY "Clients can view their own profile"
    ON clients FOR SELECT
    TO authenticated
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Clients can update their own profile"
    ON clients FOR UPDATE
    TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Authenticated users can create a client profile"
    ON clients FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Service role has full access to clients"
    ON clients FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Policies: specialist_services
-- Public can read mappings of active specialists to services.
-- ============================================================================
CREATE POLICY "Public users can view specialist services"
    ON specialist_services FOR SELECT
    USING (true);

CREATE POLICY "Service role has full access to specialist_services"
    ON specialist_services FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Policies: availability_slots
-- Public can view open slots for upcoming dates.
-- Specialists can manage their own slots.
-- ============================================================================
CREATE POLICY "Public can view available future slots"
    ON availability_slots FOR SELECT
    USING (is_available = true AND slot_date >= CURRENT_DATE);

CREATE POLICY "Specialists can view all their own slots"
    ON availability_slots FOR SELECT
    TO authenticated
    USING (
        specialist_id IN (
            SELECT id FROM specialists WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Specialists can insert their own availability slots"
    ON availability_slots FOR INSERT
    TO authenticated
    WITH CHECK (
        specialist_id IN (
            SELECT id FROM specialists WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Specialists can update their own availability slots"
    ON availability_slots FOR UPDATE
    TO authenticated
    USING (
        specialist_id IN (
            SELECT id FROM specialists WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        specialist_id IN (
            SELECT id FROM specialists WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to availability_slots"
    ON availability_slots FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Policies: bookings
-- Strict privacy: Clients see only their bookings. Specialists see their own bookings.
-- ============================================================================
CREATE POLICY "Clients can view their own bookings"
    ON bookings FOR SELECT
    TO authenticated
    USING (
        client_id IN (
            SELECT id FROM clients WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Specialists can view assigned bookings"
    ON bookings FOR SELECT
    TO authenticated
    USING (
        specialist_id IN (
            SELECT id FROM specialists WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Clients can create bookings for themselves"
    ON bookings FOR INSERT
    TO authenticated
    WITH CHECK (
        client_id IN (
            SELECT id FROM clients WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Clients can cancel their own bookings"
    ON bookings FOR UPDATE
    TO authenticated
    USING (
        client_id IN (
            SELECT id FROM clients WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        client_id IN (
            SELECT id FROM clients WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Specialists can update status of assigned bookings"
    ON bookings FOR UPDATE
    TO authenticated
    USING (
        specialist_id IN (
            SELECT id FROM specialists WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        specialist_id IN (
            SELECT id FROM specialists WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to bookings"
    ON bookings FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

