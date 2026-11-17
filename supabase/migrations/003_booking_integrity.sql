-- ============================================================================
-- Migration 003: Booking Integrity & Double-Booking Prevention
-- Project: Smart Appointment & Consultation Booking Platform
-- Description: Database-level concurrency control, partial unique index,
--              automatic slot synchronization triggers, and atomic RPC stored procedures.
-- ============================================================================

-- ============================================================================
-- 1. Partial Unique Index (Engine-Level Double-Booking Prevention)
-- Guarantees that at the database engine level, an availability slot can never
-- have more than ONE active (Pending or Confirmed) reservation.
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_slot_booking
    ON bookings (availability_slot_id)
    WHERE (status IN ('Pending', 'Confirmed'));

-- ============================================================================
-- 2. Trigger Function: Sync Slot Availability with Booking Lifecycle
-- Automatically updates availability_slots.is_available whenever bookings are
-- created, rescheduled, cancelled, or completed.
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_slot_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- CASE A: New booking inserted
    IF TG_OP = 'INSERT' THEN
        IF NEW.status IN ('Pending', 'Confirmed') THEN
            UPDATE availability_slots
            SET is_available = false, updated_at = NOW()
            WHERE id = NEW.availability_slot_id;
        END IF;
        RETURN NEW;

    -- CASE B: Booking updated (status change or rescheduling)
    ELSIF TG_OP = 'UPDATE' THEN
        -- Slot changed (Rescheduling)
        IF OLD.availability_slot_id <> NEW.availability_slot_id THEN
            -- Free the old slot if previous status was active
            IF OLD.status IN ('Pending', 'Confirmed') THEN
                UPDATE availability_slots
                SET is_available = true, updated_at = NOW()
                WHERE id = OLD.availability_slot_id;
            END IF;

            -- Reserve the new slot if new status is active
            IF NEW.status IN ('Pending', 'Confirmed') THEN
                UPDATE availability_slots
                SET is_available = false, updated_at = NOW()
                WHERE id = NEW.availability_slot_id;
            END IF;

        -- Status changed on the same slot
        ELSIF OLD.status <> NEW.status THEN
            -- Transition to Cancelled releases the slot
            IF NEW.status = 'Cancelled' AND OLD.status IN ('Pending', 'Confirmed') THEN
                UPDATE availability_slots
                SET is_available = true, updated_at = NOW()
                WHERE id = NEW.availability_slot_id;

            -- Transition back to active reserves the slot
            ELSIF NEW.status IN ('Pending', 'Confirmed') AND OLD.status = 'Cancelled' THEN
                UPDATE availability_slots
                SET is_available = false, updated_at = NOW()
                WHERE id = NEW.availability_slot_id;
            END IF;
        END IF;
        RETURN NEW;

    -- CASE C: Booking deleted (Safety cleanup)
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status IN ('Pending', 'Confirmed') THEN
            UPDATE availability_slots
            SET is_available = true, updated_at = NOW()
            WHERE id = OLD.availability_slot_id;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_slot_availability ON bookings;
CREATE TRIGGER trg_sync_slot_availability
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION sync_slot_availability();

-- ============================================================================
-- 3. Stored Procedure: book_appointment (Atomic RPC)
-- Atomically reserves a slot and creates a booking with row-level locking.
-- ============================================================================
CREATE OR REPLACE FUNCTION book_appointment(
    p_client_id UUID,
    p_specialist_id UUID,
    p_service_id UUID,
    p_slot_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_slot RECORD;
    v_booking_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Verify specialist offers this service
    IF NOT EXISTS (
        SELECT 1 FROM specialist_services
        WHERE specialist_id = p_specialist_id AND service_id = p_service_id
    ) THEN
        RAISE EXCEPTION 'Specialist % is not authorized to provide service %', p_specialist_id, p_service_id
            USING ERRCODE = 'check_violation';
    END IF;

    -- 2. Lock the availability slot row for update (prevents concurrent race conditions)
    SELECT * INTO v_slot
    FROM availability_slots
    WHERE id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Availability slot % does not exist', p_slot_id
            USING ERRCODE = 'no_data_found';
    END IF;

    IF v_slot.specialist_id <> p_specialist_id THEN
        RAISE EXCEPTION 'Availability slot does not belong to the selected specialist'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    IF NOT v_slot.is_available THEN
        RAISE EXCEPTION 'Availability slot is already booked or unavailable'
            USING ERRCODE = 'check_violation';
    END IF;

    -- 3. Insert the new booking (Trigger will also set slot is_available = false)
    INSERT INTO bookings (
        client_id,
        specialist_id,
        service_id,
        availability_slot_id,
        status,
        notes
    ) VALUES (
        p_client_id,
        p_specialist_id,
        p_service_id,
        p_slot_id,
        'Confirmed',
        p_notes
    ) RETURNING id INTO v_booking_id;

    -- 4. Construct JSON response
    SELECT json_build_object(
        'success', true,
        'booking_id', b.id,
        'client_id', b.client_id,
        'specialist_id', b.specialist_id,
        'service_id', b.service_id,
        'availability_slot_id', b.availability_slot_id,
        'status', b.status,
        'created_at', b.created_at
    )::jsonb INTO v_result
    FROM bookings b
    WHERE b.id = v_booking_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Stored Procedure: cancel_booking (Atomic RPC)
-- Atomically cancels a booking and frees the availability slot.
-- ============================================================================
CREATE OR REPLACE FUNCTION cancel_booking(
    p_booking_id UUID,
    p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
BEGIN
    -- 1. Lock the booking row for update
    SELECT * INTO v_booking
    FROM bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking with ID % not found', p_booking_id
            USING ERRCODE = 'no_data_found';
    END IF;

    IF v_booking.status = 'Cancelled' THEN
        RAISE EXCEPTION 'Booking is already cancelled'
            USING ERRCODE = 'check_violation';
    END IF;

    -- 2. Update booking status (Trigger automatically releases availability slot)
    UPDATE bookings
    SET status = 'Cancelled',
        notes = CASE
            WHEN p_cancellation_reason IS NOT NULL AND notes IS NOT NULL THEN notes || ' | Cancellation Reason: ' || p_cancellation_reason
            WHEN p_cancellation_reason IS NOT NULL THEN 'Cancellation Reason: ' || p_cancellation_reason
            ELSE notes
        END,
        updated_at = NOW()
    WHERE id = p_booking_id;

    RETURN json_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'status', 'Cancelled',
        'slot_released', v_booking.availability_slot_id
    )::jsonb;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. Stored Procedure: reschedule_booking (Atomic RPC)
-- Atomically releases old slot and claims new slot for an existing booking.
-- ============================================================================
CREATE OR REPLACE FUNCTION reschedule_booking(
    p_booking_id UUID,
    p_new_slot_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_new_slot RECORD;
BEGIN
    -- 1. Lock the existing booking
    SELECT * INTO v_booking
    FROM bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking % not found', p_booking_id
            USING ERRCODE = 'no_data_found';
    END IF;

    IF v_booking.status = 'Cancelled' THEN
        RAISE EXCEPTION 'Cannot reschedule a cancelled booking'
            USING ERRCODE = 'check_violation';
    END IF;

    IF v_booking.availability_slot_id = p_new_slot_id THEN
        RAISE EXCEPTION 'New slot must be different from the currently booked slot'
            USING ERRCODE = 'check_violation';
    END IF;

    -- 2. Lock the target new slot
    SELECT * INTO v_new_slot
    FROM availability_slots
    WHERE id = p_new_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'New availability slot % not found', p_new_slot_id
            USING ERRCODE = 'no_data_found';
    END IF;

    IF v_new_slot.specialist_id <> v_booking.specialist_id THEN
        RAISE EXCEPTION 'Target slot belongs to a different specialist'
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;

    IF NOT v_new_slot.is_available THEN
        RAISE EXCEPTION 'Target availability slot is not available'
            USING ERRCODE = 'check_violation';
    END IF;

    -- 3. Update the booking (Trigger automatically swaps slot availability)
    UPDATE bookings
    SET availability_slot_id = p_new_slot_id,
        updated_at = NOW()
    WHERE id = p_booking_id;

    RETURN json_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'previous_slot_id', v_booking.availability_slot_id,
        'new_slot_id', p_new_slot_id,
        'status', v_booking.status
    )::jsonb;
END;
$$ LANGUAGE plpgsql;

