-- School Clinic Management System - Database Schema
-- Multi-tenant architecture using Nile's tenant_id

-- =========================
-- STUDENTS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS students (
    tenant_id UUID NOT NULL,
    id UUID NOT NULL,
    full_name TEXT NOT NULL,
    grade_level INTEGER NOT NULL,
    section VARCHAR(20) NOT NULL,
    sex VARCHAR(10) CHECK (sex IN ('Male', 'Female')),
    dob DATE NOT NULL,
    contact_number VARCHAR(20),
    address TEXT,
    emergency_contact_person TEXT,
    emergency_contact_number VARCHAR(20),
    profile_image_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (tenant_id, id)
);

-- =========================
-- CLINIC USERS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS clinic_users (
    tenant_id UUID NOT NULL,
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    dob DATE NOT NULL,
    address TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    profile_image_url TEXT,
    role VARCHAR(10) NOT NULL CHECK (role IN ('Nurse', 'Admin')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (tenant_id, id),
    UNIQUE (tenant_id, email)
);

-- =========================
-- CLINIC VISITS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS clinic_visits (
    tenant_id UUID NOT NULL,
    id UUID NOT NULL,
    student_id UUID NOT NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_in TIME NOT NULL,
    chief_complaint TEXT NOT NULL,
    systolic INTEGER,
    diastolic INTEGER,
    pulse_rate INTEGER,
    respiratory_rate INTEGER,
    temperature DECIMAL(4,1),
    assessment TEXT,
    intervention TEXT,
    medication_given TEXT,
    disposition TEXT NOT NULL,
    nurse_name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (tenant_id, id),

    FOREIGN KEY (tenant_id, student_id)
        REFERENCES students (tenant_id, id)
        ON DELETE CASCADE
);

-- =========================
-- INDEXES
-- =========================
CREATE INDEX IF NOT EXISTS idx_clinic_users_email
    ON clinic_users(tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_visits_student
    ON clinic_visits(tenant_id, student_id);

CREATE INDEX IF NOT EXISTS idx_visits_date
    ON clinic_visits(tenant_id, visit_date);
