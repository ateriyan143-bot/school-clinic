# Nile Database Setup Guide

## 📋 Step 1: Create Your Nile Workspace

1. Go to [https://console.thenile.dev](https://console.thenile.dev)
2. Sign up or log in
3. Create a new workspace
4. Create a new database

---

## 📋 Step 2: Run the Schema (Copy & Paste)

Open the Nile SQL Console and paste the following:

```sql
-- School Clinic Management System - Database Schema
-- Multi-tenant architecture using Nile's tenant_id

-- Table: Students
-- Stores permanent biographical and academic data of students
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    student_id_no VARCHAR(50) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    grade_level INTEGER NOT NULL,
    section VARCHAR(20) NOT NULL,
    sex VARCHAR(10),
    dob DATE NOT NULL,
    contact_number VARCHAR(20),
    address TEXT,
    emergency_contact_person TEXT,
    emergency_contact_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: Clinic_Visits
-- Stores transactional medical logs linked to students
CREATE TABLE IF NOT EXISTS clinic_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    visit_date DATE DEFAULT CURRENT_DATE,
    time_in TIME NOT NULL,
    chief_complaint TEXT NOT NULL,
    blood_pressure VARCHAR(10),
    pulse_rate INTEGER,
    respiratory_rate INTEGER,
    temperature DECIMAL(4,1),
    assessment TEXT,
    intervention TEXT,
    medication_given TEXT,
    disposition TEXT NOT NULL,
    nurse_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_tenant ON students(tenant_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id_no);
CREATE INDEX IF NOT EXISTS idx_visits_tenant ON clinic_visits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visits_student ON clinic_visits(student_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON clinic_visits(visit_date);
```

---

## 📋 Step 3: Insert Sample Data (Optional)

If you want test data, paste this after the schema:

```sql
-- Sample Students
INSERT INTO students (tenant_id, student_id_no, full_name, grade_level, section, sex, dob, contact_number, address, emergency_contact_person, emergency_contact_number) VALUES
('00000000-0000-0000-0000-000000000000', 'S101', 'James Carter', 10, 'A', 'Male', '2008-05-15', '(555) 123-4567', '123 Oak St, Springfield, IL', 'Mary Carter', '(555) 123-4568'),
('00000000-0000-0000-0000-000000000000', 'S102', 'Emily Watson', 8, 'B', 'Female', '2010-09-22', '(555) 234-5678', '456 Elm St, Springfield, IL', 'John Watson', '(555) 234-5679'),
('00000000-0000-0000-0000-000000000000', 'S103', 'Michael Rodriguez', 11, 'C', 'Male', '2007-02-10', '(555) 345-6789', '789 Pine St, Springfield, IL', 'Sofia Rodriguez', '(555) 345-6790'),
('00000000-0000-0000-0000-000000000000', 'S104', 'Sophia Lee', 7, 'A', 'Female', '2011-11-30', '(555) 456-7890', '321 Maple St, Springfield, IL', 'David Lee', '(555) 456-7891');

-- To get actual student IDs for visits, run this query:
-- SELECT id, student_id_no, full_name FROM students;

-- Sample Clinic Visits (Update student_id with actual IDs from above query)
-- INSERT INTO clinic_visits (tenant_id, student_id, visit_date, time_in, chief_complaint, blood_pressure, pulse_rate, respiratory_rate, temperature, assessment, intervention, medication_given, disposition, nurse_name) VALUES
-- ('00000000-0000-0000-0000-000000000000', 'REPLACE-WITH-STUDENT-UUID', '2024-04-23', '10:30:00', 'Headache', '120/80', 90, 18, 98.6, 'Tension Headache', 'Rest, Hydration', 'Acetaminophen', 'Returned to Class', 'Nurse Kelly');
```

**Note:** Replace `00000000-0000-0000-0000-000000000000` with your actual tenant ID from Nile.

---

## 📋 Step 4: Get Your Connection Details

From the Nile Console:
1. Go to your database
2. Click "Connection Info"
3. Copy the connection string

---

## 📋 Step 5: Update Your .env File

Update `server/.env` with your Nile connection:

```env
DATABASE_URL=postgresql://user:password@db.thenile.dev:5432/your_database
DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000000
PORT=3001
```

Replace:
- `user:password` - Your Nile credentials
- `your_database` - Your database name
- `DEFAULT_TENANT_ID` - Your tenant UUID from Nile

---

## 📋 Step 6: Verify Setup

Run this query in Nile Console to verify:

```sql
-- Check tables created
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check student count
SELECT COUNT(*) FROM students;

-- Check if sample data loaded
SELECT student_id_no, full_name, grade_level FROM students LIMIT 5;
```

---

## 🎯 Quick Tips for Nile

1. **Tenant ID**: Nile automatically creates tenants. Get your tenant ID from the Nile Console under "Tenants"
2. **Multi-tenancy**: All queries are automatically filtered by tenant_id when using Nile's tenant context
3. **Users**: Create users in the Nile Console and associate them with tenants
4. **Connection Pooling**: Nile handles this automatically

---

## 🔧 Troubleshooting

**Can't connect to Nile?**
- Verify your connection string in `.env`
- Check if your IP is whitelisted in Nile Console
- Ensure SSL is enabled (Nile requires SSL)

**Tenant isolation not working?**
- Make sure DEFAULT_TENANT_ID matches your Nile tenant
- Verify tenant_id is included in all INSERT queries

**Need help?**
- [Nile Documentation](https://www.thenile.dev/docs)
- [Nile Discord Community](https://discord.gg/nile)

---

## ✅ You're Ready!

Once setup is complete:

```bash
# Start backend
cd server
npm run dev

# Start frontend (new terminal)
cd client
npm run dev
```

Access at: http://localhost:5173
