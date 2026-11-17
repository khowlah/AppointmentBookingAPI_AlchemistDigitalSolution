-- ============================================================================
-- Migration 001: Initial Schema
-- Project: Smart Appointment & Consultation Booking Platform
-- Description: Core tables, relational constraints, exclusion constraints,
--              compound integrity foreign keys, and performance indexes.
-- ============================================================================

-- 1. Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Trigger Function for updated_at Timestamp Maintenance
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Table: services
-- Description: Catalog of consultation services offered on the platform
-- ============================================================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    fee NUMERIC(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_service_duration_positive CHECK (duration_minutes > 0),
    CONSTRAINT chk_service_fee_non_negative CHECK (fee >= 0.00)
);

CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Table: specialists
-- Description: Registered specialist profiles, credentials, and specialties
-- ============================================================================
CREATE TABLE IF NOT EXISTS specialists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    specialty VARCHAR(100) NOT NULL,
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_specialist_email_format CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

CREATE TRIGGER trg_specialists_updated_at
    BEFORE UPDATE ON specialists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Table: clients
-- Description: Client profiles and contact information
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_client_email_format CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

CREATE TRIGGER trg_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Table: specialist_services
-- Description: Many-to-many relationship mapping specialists to the services
--              they are authorized to provide
-- ============================================================================
CREATE TABLE IF NOT EXISTS specialist_services (
    specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (specialist_id, service_id)
);

-- ============================================================================
-- Table: availability_slots
-- Description: Calendar availability windows configured per specialist
-- ============================================================================
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Basic time validity
    CONSTRAINT chk_slot_chronological_times CHECK (end_time > start_time),

    -- Compound unique key required for composite foreign key constraint from bookings
    CONSTRAINT uq_availability_slot_specialist UNIQUE (id, specialist_id),

    -- Exclusion constraint preventing overlapping availability slots for the same specialist on the same day
    CONSTRAINT uq_no_overlapping_specialist_slots EXCLUDE USING gist (
        specialist_id WITH =,
        slot_date WITH =,
        tsrange((slot_date + start_time), (slot_date + end_time)) WITH &&
    )
);

CREATE TRIGGER trg_availability_slots_updated_at
    BEFORE UPDATE ON availability_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Table: bookings
-- Description: Consultation appointments booked by clients
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    availability_slot_id UUID NOT NULL REFERENCES availability_slots(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_booking_status_valid CHECK (
        status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')
    ),

    -- INTEGRITY RULE 1: The specialist MUST be certified to provide the booked service
    CONSTRAINT fk_booking_specialist_service_relationship
        FOREIGN KEY (specialist_id, service_id)
        REFERENCES specialist_services(specialist_id, service_id)
        ON DELETE RESTRICT,

    -- INTEGRITY RULE 2: The availability slot MUST belong to the specified specialist
    CONSTRAINT fk_booking_slot_specialist_relationship
        FOREIGN KEY (availability_slot_id, specialist_id)
        REFERENCES availability_slots(id, specialist_id)
        ON DELETE RESTRICT
);

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Indexes for High-Traffic Queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_services_category_active ON services (category, is_active);
CREATE INDEX IF NOT EXISTS idx_specialists_specialty_active ON specialists (specialty, is_active);
CREATE INDEX IF NOT EXISTS idx_availability_slots_lookup ON availability_slots (specialist_id, slot_date, is_available);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings (client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_specialist ON bookings (specialist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);

