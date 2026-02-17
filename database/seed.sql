-- Sample seed data for testing
-- Run this after schema.sql to populate the database with test data

-- Insert sample students
INSERT INTO students (tenant_id, id, full_name, grade_level, section, sex, dob, contact_number, address, emergency_contact_person, emergency_contact_number, profile_image_url) VALUES
('your-tenant-id', gen_random_uuid(), 'James Carter', 10, 'A', 'Male', '2008-05-15', '(555) 123-4567', '123 Oak St, Springfield, IL', 'Mary Carter', '(555) 123-4568', NULL),
('your-tenant-id', gen_random_uuid(), 'Emily Watson', 8, 'B', 'Female', '2010-09-22', '(555) 234-5678', '456 Elm St, Springfield, IL', 'John Watson', '(555) 234-5679', NULL),
('your-tenant-id', gen_random_uuid(), 'Michael Rodriguez', 11, 'C', 'Male', '2007-02-10', '(555) 345-6789', '789 Pine St, Springfield, IL', 'Sofia Rodriguez', '(555) 345-6790', NULL),
('your-tenant-id', gen_random_uuid(), 'Sophia Lee', 7, 'A', 'Female', '2011-11-30', '(555) 456-7890', '321 Maple St, Springfield, IL', 'David Lee', '(555) 456-7891', NULL);

-- Insert sample clinic visits
-- Note: Replace student_id values with actual UUIDs from your students table
INSERT INTO clinic_visits (tenant_id, student_id, visit_date, time_in, chief_complaint, blood_pressure, pulse_rate, respiratory_rate, temperature, assessment, intervention, medication_given, disposition, nurse_name) VALUES
('your-tenant-id', 'student-uuid-1', '2024-04-23', '10:30:00', 'Headache', '120/80', 90, 18, 98.6, 'Tension Headache', 'Rest, Hydration', 'Acetaminophen', 'Returned to Class', 'Nurse Kelly'),
('your-tenant-id', 'student-uuid-2', '2024-04-22', '13:15:00', 'Stomach Pain', '110/70', 85, 16, 99.2, 'Gastritis Suspected', 'Antacid Given', 'Antacid', 'Returned to Class', 'Nurse Allen'),
('your-tenant-id', 'student-uuid-3', '2024-04-20', '09:00:00', 'Dizzy & Nauseous', '110/70', 95, 20, 97.5, 'Vertigo', 'Rest, Fluids', 'None', 'Returned to Class', 'Nurse Lisa');

-- Note: Replace 'your-tenant-id' and 'student-uuid-X' with actual values from your Nile database
