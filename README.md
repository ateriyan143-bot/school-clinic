# School Clinic Management System 🏥

A comprehensive multi-tenant School Clinic Management System designed for school nurses and administrators to manage student health profiles and clinic visit logs.

## 🎯 Overview

This application provides a complete solution for digitizing school health records with multi-tenant architecture, ensuring data isolation between different school departments or branches.

## 🚀 Features

- **Multi-tenant Architecture**: Built with Nile's tenant isolation for secure data separation
- **Student Management**: Complete CRUD operations for student health profiles
- **Clinic Visit Recording**: Detailed visit logs with vital signs and assessments
- **Dashboard Analytics**: Real-time statistics and health trend visualization
- **Tenant-aware Authentication**: Secure login with Nile's built-in auth system
- **Responsive Design**: Mobile-friendly interface with modern UI

## 📋 Tech Stack

### Frontend
- **React.js** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **@niledatabase/react** - Nile React SDK

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **@niledatabase/server** - Nile Server SDK
- **pg** - PostgreSQL client
- **CORS** - Cross-origin resource sharing

### Database
- **Nile** - Serverless Postgres with built-in tenant isolation

## 📁 Project Structure

```
levy/
├── .github/
│   └── copilot-instructions.md    # AI assistant instructions
├── client/                         # React frontend
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   ├── StudentTable.jsx
│   │   │   └── RecordVisitModal.jsx
│   │   ├── pages/                 # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AddStudent.jsx
│   │   │   └── StudentProfile.jsx
│   │   ├── App.jsx                # Main app component
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
├── server/                         # Express backend
│   ├── index.js                   # Main server file
│   ├── package.json
│   └── .env.example
└── database/                       # Database schema
    └── schema.sql                 # Table definitions
```

## 🗄️ Database Schema

### Students Table
Stores permanent biographical and academic data.

| Column                      | Type         | Description                    |
|-----------------------------|--------------|--------------------------------|
| id                          | UUID         | Primary key                    |
| tenant_id                   | UUID         | Nile tenant identifier         |
| student_id_no               | VARCHAR(50)  | Unique student ID              |
| full_name                   | TEXT         | Student's full name            |
| grade_level                 | INTEGER      | Current grade level            |
| section                     | VARCHAR(20)  | Class section                  |
| sex                         | VARCHAR(10)  | Gender                         |
| dob                         | DATE         | Date of birth                  |
| contact_number              | VARCHAR(20)  | Contact phone number           |
| address                     | TEXT         | Home address                   |
| emergency_contact_person    | TEXT         | Emergency contact name         |
| emergency_contact_number    | VARCHAR(20)  | Emergency contact phone        |
| created_at                  | TIMESTAMP    | Record creation timestamp      |

### Clinic_Visits Table
Stores medical visit logs linked to students.

| Column            | Type          | Description                        |
|-------------------|---------------|------------------------------------|
| id                | UUID          | Primary key                        |
| tenant_id         | UUID          | Nile tenant identifier             |
| student_id        | UUID          | Foreign key to students            |
| visit_date        | DATE          | Date of visit                      |
| time_in           | TIME          | Admission time                     |
| chief_complaint   | TEXT          | Primary complaint                  |
| blood_pressure    | VARCHAR(10)   | Blood pressure (e.g., "120/80")    |
| pulse_rate        | INTEGER       | Heart rate (bpm)                   |
| respiratory_rate  | INTEGER       | Breathing rate (breaths/min)       |
| temperature       | DECIMAL(4,1)  | Body temperature (°F)              |
| assessment        | TEXT          | Nurse's assessment                 |
| intervention      | TEXT          | Treatment provided                 |
| medication_given  | TEXT          | Medications administered           |
| disposition       | TEXT          | Outcome (e.g., "Returned to Class")|
| nurse_name        | TEXT          | Attending nurse                    |
| created_at        | TIMESTAMP     | Record creation timestamp          |

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Nile account ([sign up](https://console.thenile.dev))
- Git installed

### 1. Clone and Setup

```bash
# Clone the repository
cd levy

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Configure Nile

1. Create a Nile workspace at [https://console.thenile.dev](https://console.thenile.dev)
2. Create a new database
3. Run the SQL schema from `database/schema.sql` in the Nile console

### 3. Environment Variables

**Client (.env)**
```env
VITE_NILE_URL=https://your-workspace.nile.dev
VITE_NILE_DATABASE=your_database_name
```

**Server (.env)**
```env
NILE_URL=https://your-workspace.nile.dev
NILE_DATABASE=your_database_name
PORT=3001
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🔐 Authentication

The system uses Nile's built-in tenant-aware authentication:

1. Users must register/login through Nile's auth system
2. Each user is associated with a tenant (school/department)
3. All data queries are automatically filtered by tenant_id
4. No cross-tenant data access is possible

### Creating Test Users

Use Nile Console to create test users:
1. Go to your Nile workspace
2. Navigate to "Authentication"
3. Create tenants and users
4. Assign users to tenants

## 📊 API Endpoints

### Students
- `GET /api/students` - Get all students (tenant-filtered)
- `GET /api/students/:id` - Get single student
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Clinic Visits
- `GET /api/visits` - Get all visits (tenant-filtered)
- `GET /api/students/:id/visits` - Get visits for specific student
- `POST /api/visits` - Record new clinic visit

### Analytics
- `GET /api/analytics/stats` - Dashboard statistics
- `GET /api/analytics/illness-frequency` - Common illnesses data

### Health Check
- `GET /health` - Server health status

## 🎨 UI Components

### Pages
- **Login** - Authentication page with email/password
- **Dashboard** - Overview with stats and student list
- **AddStudent** - Form to register new students
- **StudentProfile** - Detailed view with visit history

### Components
- **Sidebar** - Navigation menu with user info
- **StatsCard** - Reusable dashboard metric card
- **StudentTable** - Sortable table with actions
- **RecordVisitModal** - Form for logging clinic visits

## 🔒 Security Features

- JWT-based authentication via Nile
- Tenant isolation at database level
- Authorization middleware on all API routes
- CORS configuration for frontend-backend communication
- Input validation on all forms
- SQL injection prevention through parameterized queries

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy the 'dist' folder
```

### Backend (Railway/Render/Fly.io)
```bash
cd server
# Deploy with environment variables configured
```

### Database
Nile handles hosting, backups, and scaling automatically.

## 📝 Development Guidelines

### Adding New Features
1. Database changes: Update `database/schema.sql`
2. Backend: Add routes in `server/index.js`
3. Frontend: Create components in appropriate folders
4. Update documentation in this README

### Code Style
- Use ES6+ syntax
- Follow React best practices
- Use Tailwind utility classes
- Keep components small and focused
- Add error handling to all API calls

## 🐛 Troubleshooting

### Common Issues

**"Failed to connect to Nile"**
- Verify NILE_URL and NILE_DATABASE in .env files
- Check Nile workspace status in console
- Ensure database is created and accessible

**"Unauthorized" errors**
- Check if user is logged in
- Verify JWT token is being sent in headers
- Ensure tenant associations are correct

**CORS errors**
- Verify backend is running on port 3001
- Check CORS configuration in server/index.js
- Ensure frontend proxy is configured in vite.config.js

## 📚 Resources

- [Nile Documentation](https://www.thenile.dev/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Express Documentation](https://expressjs.com)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For issues or questions:
- Open an issue on GitHub
- Contact: [Your support email]
- Documentation: [Project Wiki]

---

Built with ❤️ for schools and healthcare professionals
#   S C H O O L - C L I N I C  
 