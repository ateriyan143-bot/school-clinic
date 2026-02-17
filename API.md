# API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All endpoints (except `/auth/login`) require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### POST /auth/login
Login to the system.

**Request Body:**
```json
{
  "email": "nurse@school.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "demo-token-1234567890",
  "user": {
    "id": "user-1",
    "email": "nurse@school.edu",
    "tenantId": "default-tenant"
  }
}
```

---

## Student Endpoints

### GET /students
Get all students for the current tenant.

**Response:**
```json
[
  {
    "id": "uuid",
    "tenant_id": "uuid",
    "student_id_no": "STU-2024-001",
    "full_name": "John Smith",
    "grade_level": 10,
    "section": "A",
    "sex": "Male",
    "dob": "2008-05-15",
    "contact_number": "(555) 123-4567",
    "address": "123 Main St",
    "emergency_contact_person": "Jane Smith",
    "emergency_contact_number": "(555) 987-6543",
    "created_at": "2024-01-15T10:30:00Z",
    "last_visit": "2024-04-23"
  }
]
```

### GET /students/:id
Get a single student by ID.

**Response:**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "student_id_no": "STU-2024-001",
  "full_name": "John Smith",
  ...
}
```

### POST /students
Create a new student.

**Request Body:**
```json
{
  "student_id_no": "STU-2024-001",
  "full_name": "John Smith",
  "grade_level": 10,
  "section": "A",
  "sex": "Male",
  "dob": "2008-05-15",
  "contact_number": "(555) 123-4567",
  "address": "123 Main St",
  "emergency_contact_person": "Jane Smith",
  "emergency_contact_number": "(555) 987-6543"
}
```

**Response:**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "student_id_no": "STU-2024-001",
  ...
}
```

### PUT /students/:id
Update an existing student.

**Request Body:** Same as POST /students

**Response:** Updated student object

### DELETE /students/:id
Delete a student.

**Response:**
```json
{
  "message": "Student deleted successfully"
}
```

---

## Clinic Visit Endpoints

### GET /students/:id/visits
Get all clinic visits for a specific student.

**Response:**
```json
[
  {
    "id": "uuid",
    "tenant_id": "uuid",
    "student_id": "uuid",
    "visit_date": "2024-04-23",
    "time_in": "10:30:00",
    "chief_complaint": "Headache",
    "blood_pressure": "120/80",
    "pulse_rate": 90,
    "respiratory_rate": 18,
    "temperature": 98.6,
    "assessment": "Tension headache",
    "intervention": "Rest, hydration",
    "medication_given": "Acetaminophen",
    "disposition": "Returned to Class",
    "nurse_name": "Nurse Kelly",
    "created_at": "2024-04-23T10:30:00Z"
  }
]
```

### GET /visits
Get all clinic visits for the current tenant.

**Response:** Array of visit objects with student info

### POST /visits
Record a new clinic visit.

**Request Body:**
```json
{
  "student_id": "uuid",
  "visit_date": "2024-04-23",
  "time_in": "10:30:00",
  "chief_complaint": "Headache",
  "blood_pressure": "120/80",
  "pulse_rate": 90,
  "respiratory_rate": 18,
  "temperature": 98.6,
  "assessment": "Tension headache",
  "intervention": "Rest, hydration",
  "medication_given": "Acetaminophen",
  "disposition": "Returned to Class",
  "nurse_name": "Nurse Kelly"
}
```

**Response:** Created visit object

---

## Analytics Endpoints

### GET /analytics/stats
Get dashboard statistics.

**Response:**
```json
{
  "totalStudents": 245,
  "visitsToday": 18,
  "visitsThisMonth": 342,
  "commonIllness": "Headache"
}
```

### GET /analytics/illness-frequency
Get frequency of illnesses.

**Response:**
```json
[
  {
    "chief_complaint": "Headache",
    "count": "45"
  },
  {
    "chief_complaint": "Stomach Pain",
    "count": "32"
  }
]
```

---

## Health Check

### GET /health
Check if the server is running.

**Response:**
```json
{
  "status": "ok"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Student not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch students"
}
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nurse@school.edu","password":"password"}'
```

### Get Students
```bash
curl http://localhost:3001/api/students \
  -H "Authorization: Bearer your-token-here"
```

### Create Student
```bash
curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token-here" \
  -d '{
    "student_id_no": "STU-2024-001",
    "full_name": "John Smith",
    "grade_level": 10,
    "section": "A",
    "sex": "Male",
    "dob": "2008-05-15",
    "contact_number": "(555) 123-4567",
    "address": "123 Main St",
    "emergency_contact_person": "Jane Smith",
    "emergency_contact_number": "(555) 987-6543"
  }'
```

### Record Visit
```bash
curl -X POST http://localhost:3001/api/visits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token-here" \
  -d '{
    "student_id": "student-uuid",
    "visit_date": "2024-04-23",
    "time_in": "10:30:00",
    "chief_complaint": "Headache",
    "blood_pressure": "120/80",
    "pulse_rate": 90,
    "respiratory_rate": 18,
    "temperature": 98.6,
    "assessment": "Tension headache",
    "intervention": "Rest, hydration",
    "medication_given": "Acetaminophen",
    "disposition": "Returned to Class",
    "nurse_name": "Nurse Kelly"
  }'
```
