-- ============================================================================
-- Seed Data File: Realistic Sample Records
-- Project: Smart Appointment & Consultation Booking Platform
-- ============================================================================

-- Clean existing data in reverse order of foreign keys for clean re-runs
TRUNCATE TABLE bookings, availability_slots, specialist_services, clients, specialists, services CASCADE;

-- ============================================================================
-- 1. Services (6 realistic services across distinct consultation categories)
-- ============================================================================
INSERT INTO services (id, title, description, duration_minutes, fee, category, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'General Medical Consultation', 'Comprehensive initial medical evaluation, symptom review, and preventive advice.', 30, 75.00, 'General Medicine', true),
    ('11111111-1111-1111-1111-111111111102', 'Cardiology Follow-Up', 'Specialized cardiovascular review, ECG report assessment, and medication adjustment.', 45, 150.00, 'Cardiology', true),
    ('11111111-1111-1111-1111-111111111103', 'Pediatric Wellness Checkup', 'Developmental milestone assessment, nutritional guidance, and pediatric screening.', 30, 85.00, 'Pediatrics', true),
    ('11111111-1111-1111-1111-111111111104', 'Dermatology Skin Evaluation', 'Full-body mole examination, dermatitis evaluation, and acne care protocol.', 45, 120.00, 'Dermatology', true),
    ('11111111-1111-1111-1111-111111111105', 'Nutrition & Diet Therapy', 'Personalized macronutrient profiling and chronic disease lifestyle management.', 60, 95.00, 'Nutrition', true),
    ('11111111-1111-1111-1111-111111111106', 'Executive Health Screening', 'Multi-system comprehensive health assessment with full lab review.', 90, 250.00, 'General Medicine', true);

-- ============================================================================
-- 2. Specialists (4 certified specialists)
-- ============================================================================
INSERT INTO specialists (id, full_name, email, phone, specialty, bio, is_active)
VALUES
    ('22222222-2222-2222-2222-222222222201', 'Dr. Sarah Al-Mansoor', 'sarah.mansoor@example.com', '+966501112233', 'General Medicine', 'Board-certified internist with over 12 years of clinical diagnostic experience in outpatient care.', true),
    ('22222222-2222-2222-2222-222222222202', 'Dr. Tariq Al-Ghamdi', 'tariq.ghamdi@example.com', '+966502223344', 'Cardiology', 'Senior Consultant Cardiologist specializing in preventive heart health and hypertensive disorders.', true),
    ('22222222-2222-2222-2222-222222222203', 'Dr. Layla Hashim', 'layla.hashim@example.com', '+966503334455', 'Pediatrics', 'Fellow of Pediatric Medicine focused on infant nutrition, child development, and preventive wellness.', true),
    ('22222222-2222-2222-2222-222222222204', 'Dr. Ziyad Al-Khatib', 'ziyad.khatib@example.com', '+966504445566', 'Dermatology', 'Dermatologist and aesthetic medicine specialist with international certifications in clinical dermatology.', true);

-- ============================================================================
-- 3. Clients (6 clients)
-- ============================================================================
INSERT INTO clients (id, full_name, email, phone)
VALUES
    ('33333333-3333-3333-3333-333333333301', 'Ahmed Al-Otaibi', 'ahmed.otaibi@example.com', '+966551110001'),
    ('33333333-3333-3333-3333-333333333302', 'Fatima Al-Zahrani', 'fatima.zahrani@example.com', '+966552220002'),
    ('33333333-3333-3333-3333-333333333303', 'Khalid Al-Harbi', 'khalid.harbi@example.com', '+966553330003'),
    ('33333333-3333-3333-3333-333333333304', 'Noura Al-Shehri', 'noura.shehri@example.com', '+966554440004'),
    ('33333333-3333-3333-3333-333333333305', 'Omar Al-Dosari', 'omar.dosari@example.com', '+966555550005'),
    ('33333333-3333-3333-3333-333333333306', 'Reem Al-Mutairi', 'reem.mutairi@example.com', '+966556660006');

-- ============================================================================
-- 4. Specialist Services (Mappings)
-- ============================================================================
INSERT INTO specialist_services (specialist_id, service_id)
VALUES
    -- Dr. Sarah (General Medicine, Executive Health, Nutrition)
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101'),
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111105'),
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111106'),

    -- Dr. Tariq (Cardiology, General Medical)
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102'),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101'),

    -- Dr. Layla (Pediatrics, General Medical)
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103'),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101'),

    -- Dr. Ziyad (Dermatology)
    ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111104');

-- ============================================================================
-- 5. Availability Slots (Distinct non-overlapping time windows)
-- ============================================================================
INSERT INTO availability_slots (id, specialist_id, slot_date, start_time, end_time, is_available)
VALUES
    -- Dr. Sarah (2026-12-01)
    ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201', '2026-12-01', '09:00:00', '09:30:00', true),
    ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222201', '2026-12-01', '09:30:00', '10:00:00', true),
    ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222201', '2026-12-01', '10:00:00', '10:30:00', true),
    ('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222201', '2026-12-01', '11:00:00', '11:30:00', true),

    -- Dr. Tariq (2026-12-01)
    ('44444444-4444-4444-4444-444444444405', '22222222-2222-2222-2222-222222222202', '2026-12-01', '09:00:00', '09:45:00', true),
    ('44444444-4444-4444-4444-444444444406', '22222222-2222-2222-2222-222222222202', '2026-12-01', '10:00:00', '10:45:00', true),
    ('44444444-4444-4444-4444-444444444407', '22222222-2222-2222-2222-222222222202', '2026-12-01', '11:00:00', '11:45:00', true),

    -- Dr. Layla (2026-12-02)
    ('44444444-4444-4444-4444-444444444408', '22222222-2222-2222-2222-222222222203', '2026-12-02', '14:00:00', '14:30:00', true),
    ('44444444-4444-4444-4444-444444444409', '22222222-2222-2222-2222-222222222203', '2026-12-02', '14:30:00', '15:00:00', true),
    ('44444444-4444-4444-4444-444444444410', '22222222-2222-2222-2222-222222222203', '2026-12-02', '15:00:00', '15:30:00', true),

    -- Dr. Ziyad (2026-12-02)
    ('44444444-4444-4444-4444-444444444411', '22222222-2222-2222-2222-222222222204', '2026-12-02', '16:00:00', '16:45:00', true),
    ('44444444-4444-4444-4444-444444444412', '22222222-2222-2222-2222-222222222204', '2026-12-02', '17:00:00', '17:45:00', true);

-- ============================================================================
-- 6. Sample Bookings (Demonstrating all statuses)
-- Notice: Triggers will automatically mark Confirmed/Pending slots as is_available = false
-- ============================================================================
INSERT INTO bookings (id, client_id, specialist_id, service_id, availability_slot_id, status, notes)
VALUES
    -- Confirmed Booking (Slot 01 -> is_available will become false)
    ('55555555-5555-5555-5555-555555555501',
     '33333333-3333-3333-3333-333333333301',
     '22222222-2222-2222-2222-222222222201',
     '11111111-1111-1111-1111-111111111101',
     '44444444-4444-4444-4444-444444444401',
     'Confirmed',
     'Client reported recurring seasonal fatigue.'),

    -- Pending Booking (Slot 05 -> is_available will become false)
    ('55555555-5555-5555-5555-555555555502',
     '33333333-3333-3333-3333-333333333302',
     '22222222-2222-2222-2222-222222222202',
     '11111111-1111-1111-1111-111111111102',
     '44444444-4444-4444-4444-444444444405',
     'Pending',
     'Awaiting insurance pre-authorization check.'),

    -- Completed Booking (Slot 08 -> historic consultation)
    ('55555555-5555-5555-5555-555555555503',
     '33333333-3333-3333-3333-333333333303',
     '22222222-2222-2222-2222-222222222203',
     '11111111-1111-1111-1111-111111111103',
     '44444444-4444-4444-4444-444444444408',
     'Completed',
     'Routine 12-month developmental screening completed smoothly.'),

    -- Cancelled Booking (Slot 11 -> Slot is RELEASED and remains available for other clients)
    ('55555555-5555-5555-5555-555555555504',
     '33333333-3333-3333-3333-333333333304',
     '22222222-2222-2222-2222-222222222204',
     '11111111-1111-1111-1111-111111111104',
     '44444444-4444-4444-4444-444444444411',
     'Cancelled',
     'Client cancelled due to emergency business travel. Slot released.');

