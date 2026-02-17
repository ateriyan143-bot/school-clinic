import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pkg from 'pg'
import crypto from 'crypto'
const { Pool } = pkg

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
let initializationPromise = null

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

// Middleware
app.use(cors())
app.use(express.json({ limit: '5mb' }))

const IMAGE_DATA_URL_REGEX = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i
const MAX_IMAGE_DATA_URL_LENGTH = 2_800_000

const normalizeImageDataUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const normalizedValue = value.trim()
  if (!IMAGE_DATA_URL_REGEX.test(normalizedValue)) {
    throw new Error('Invalid image format. Please upload a valid image file.')
  }

  if (normalizedValue.length > MAX_IMAGE_DATA_URL_LENGTH) {
    throw new Error('Profile image is too large. Please upload a smaller image.')
  }

  return normalizedValue
}

const hashPassword = (plainPassword) => {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(plainPassword, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

const verifyPassword = (plainPassword, storedHash) => {
  if (!storedHash || !storedHash.includes(':')) return false
  const [salt, hash] = storedHash.split(':')
  const computed = crypto.scryptSync(plainPassword, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'))
}

const createToken = (payload) => Buffer.from(JSON.stringify(payload)).toString('base64url')

const parseToken = (token) => {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

const splitDisplayName = (displayName = '') => {
  const normalized = displayName.trim().replace(/\s+/g, ' ')
  if (!normalized) {
    return { first_name: 'User', middle_name: null, last_name: 'Account' }
  }

  const parts = normalized.split(' ')
  if (parts.length === 1) {
    return { first_name: parts[0], middle_name: null, last_name: 'Account' }
  }

  const first_name = parts[0]
  const last_name = parts[parts.length - 1]
  const middle_name = parts.slice(1, -1).join(' ') || null
  return { first_name, middle_name, last_name }
}

const calculateAge = (dob) => {
  const birthDate = new Date(dob)
  if (Number.isNaN(birthDate.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age
}

const generateTemporaryPassword = (length = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%'
  let value = ''
  for (let index = 0; index < length; index += 1) {
    const randomIndex = crypto.randomInt(0, chars.length)
    value += chars[randomIndex]
  }
  return value
}

const initializeUsersTable = async () => {
  await pool.query(`
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
      role VARCHAR(10) NOT NULL CHECK (role IN ('Nurse', 'Admin')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (tenant_id, id),
      UNIQUE (tenant_id, email)
    )
  `)

  await pool.query(`
    ALTER TABLE clinic_users
    ADD COLUMN IF NOT EXISTS profile_image_url TEXT
  `)

  const tenantId = process.env.DEFAULT_TENANT_ID || 'default-tenant'
  const bootstrapEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@school.edu').toLowerCase().trim()
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'admin123'

  const existingAdmin = await pool.query(
    `SELECT id FROM clinic_users WHERE tenant_id = $1 AND LOWER(email) = LOWER($2) LIMIT 1`,
    [tenantId, bootstrapEmail]
  )

  if (existingAdmin.rows.length === 0) {
    await pool.query(
      `INSERT INTO clinic_users (
        tenant_id, id, first_name, middle_name, last_name, dob, address, email, password_hash, role
      ) VALUES (
        $1, gen_random_uuid(), 'System', NULL, 'Administrator', '1990-01-01', 'N/A', $2, $3, 'Admin'
      )`,
      [tenantId, bootstrapEmail, hashPassword(bootstrapPassword)]
    )
  }
}

const initializeStudentsTable = async () => {
  await pool.query(`
    ALTER TABLE students
    ADD COLUMN IF NOT EXISTS profile_image_url TEXT
  `)

  const studentIdColumnResult = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_name = 'students'
       AND column_name = 'student_id_no'
     LIMIT 1`
  )

  if (studentIdColumnResult.rows.length > 0) {
    await pool.query('ALTER TABLE students ALTER COLUMN student_id_no DROP NOT NULL')
    await pool.query('ALTER TABLE students DROP CONSTRAINT IF EXISTS chk_students_student_id_no_digits_len')
  }
}

export const ensureInitialized = async () => {
  if (!initializationPromise) {
    initializationPromise = Promise.all([
      initializeUsersTable(),
      initializeStudentsTable()
    ]).catch((error) => {
      initializationPromise = null
      throw error
    })
  }

  return initializationPromise
}

// Middleware to extract tenant context (simplified - adapt to your auth system)
const extractTenant = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const tokenPayload = parseToken(token)
    req.tenantId = tokenPayload?.tenantId || process.env.DEFAULT_TENANT_ID || 'default-tenant'
    req.userId = tokenPayload?.userId || 'current-user'
    req.userRole = tokenPayload?.role || 'Nurse'
    req.userEmail = tokenPayload?.email || ''
    next()
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

// ==================== AUTH ROUTES ====================

// POST login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  
  // Simplified authentication - in production, use proper password hashing
  // and database verification
  try {
    const tenantId = process.env.DEFAULT_TENANT_ID || 'default-tenant'
    const normalizedEmail = email?.toLowerCase().trim()
    const userResult = await pool.query(
      `SELECT id, first_name, middle_name, last_name, email, role, dob, address, password_hash, created_at, profile_image_url
       FROM clinic_users
       WHERE tenant_id = $1 AND LOWER(email) = LOWER($2)
       LIMIT 1`,
      [tenantId, normalizedEmail]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const account = userResult.rows[0]
    const validPassword = verifyPassword(password, account.password_hash)

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const displayName = [account.first_name, account.middle_name, account.last_name]
      .filter(Boolean)
      .join(' ')

    const token = createToken({
      tenantId,
      userId: account.id,
      role: account.role,
      email: account.email
    })

    const user = {
      id: account.id,
      email: account.email,
      tenantId,
      role: account.role,
      display_name: displayName,
      first_name: account.first_name,
      middle_name: account.middle_name,
      last_name: account.last_name,
      dob: account.dob,
      address: account.address,
      profile_image_url: account.profile_image_url,
      created_at: account.created_at
    }

    res.json({ token, user })
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' })
  }
})

app.put('/api/auth/profile', extractTenant, async (req, res) => {
  const { display_name, email, role, profile_image_url } = req.body
  const normalizedEmail = email?.toLowerCase().trim()

  if (!display_name?.trim() || !normalizedEmail) {
    return res.status(400).json({ error: 'Display name and email are required' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  const nextRole = req.userRole === 'Admin' && ['Nurse', 'Admin'].includes(role)
    ? role
    : req.userRole

  let normalizedProfileImageUrl = null
  try {
    normalizedProfileImageUrl = normalizeImageDataUrl(profile_image_url)
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message })
    }
    return res.status(400).json({ error: 'Invalid image format. Please upload a valid image file.' })
  }

  const { first_name, middle_name, last_name } = splitDisplayName(display_name)

  try {
    const duplicateCheck = await pool.query(
      `SELECT id FROM clinic_users WHERE tenant_id = $1 AND LOWER(email) = LOWER($2) AND id <> $3 LIMIT 1`,
      [req.tenantId, normalizedEmail, req.userId]
    )

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' })
    }

    const result = await pool.query(
      `UPDATE clinic_users
       SET first_name = $1,
           middle_name = $2,
           last_name = $3,
           email = $4,
           role = $5,
           profile_image_url = $6
         WHERE tenant_id = $7 AND id = $8
       RETURNING id, email, role, first_name, middle_name, last_name, dob, address, created_at, profile_image_url`,
      [
        first_name,
        middle_name,
        last_name,
        normalizedEmail,
        nextRole,
        normalizedProfileImageUrl,
        req.tenantId,
        req.userId
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' })
    }

    const updated = result.rows[0]
    const user = {
      id: updated.id,
      email: updated.email,
      tenantId: req.tenantId,
      role: updated.role,
      display_name: [updated.first_name, updated.middle_name, updated.last_name].filter(Boolean).join(' '),
      first_name: updated.first_name,
      middle_name: updated.middle_name,
      last_name: updated.last_name,
      dob: updated.dob,
      address: updated.address,
      profile_image_url: updated.profile_image_url,
      created_at: updated.created_at
    }

    const token = createToken({
      tenantId: req.tenantId,
      userId: updated.id,
      role: updated.role,
      email: updated.email
    })

    res.json({ token, user })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' })
    }

    console.error('Error updating profile:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

app.post('/api/admin/users', extractTenant, async (req, res) => {
  if (req.userRole !== 'Admin') {
    return res.status(403).json({ error: 'Only admins can create accounts' })
  }

  const {
    first_name,
    middle_name,
    last_name,
    dob,
    address,
    email,
    password,
    role
  } = req.body

  const normalizedRole = role?.trim()
  const normalizedEmail = email?.toLowerCase().trim()

  if (!first_name?.trim() || !last_name?.trim() || !dob || !address?.trim() || !normalizedEmail || !password || !normalizedRole) {
    return res.status(400).json({ error: 'All required fields must be provided' })
  }

  if (!['Nurse', 'Admin'].includes(normalizedRole)) {
    return res.status(400).json({ error: 'Role must be Nurse or Admin' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' })
  }

  const age = calculateAge(dob)
  if (age === null) {
    return res.status(400).json({ error: 'Invalid date of birth' })
  }

  if (age < 20) {
    return res.status(400).json({ error: 'Account holder must be at least 20 years old' })
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM clinic_users WHERE tenant_id = $1 AND LOWER(email) = LOWER($2) LIMIT 1`,
      [req.tenantId, normalizedEmail]
    )

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' })
    }

    const passwordHash = hashPassword(password)
    const result = await pool.query(
      `INSERT INTO clinic_users (
        tenant_id, id, first_name, middle_name, last_name, dob, address, email, password_hash, role
      ) VALUES (
        $1, gen_random_uuid(), $2, $3, $4, $5, $6, $7, $8, $9
      )
      RETURNING id, first_name, middle_name, last_name, dob, address, email, role, created_at, profile_image_url`,
      [
        req.tenantId,
        first_name.trim(),
        middle_name?.trim() || null,
        last_name.trim(),
        dob,
        address.trim(),
        normalizedEmail,
        passwordHash,
        normalizedRole
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' })
    }

    console.error('Error creating account:', error)
    res.status(500).json({ error: 'Failed to create account' })
  }
})

app.get('/api/admin/users', extractTenant, async (req, res) => {
  if (req.userRole !== 'Admin') {
    return res.status(403).json({ error: 'Only admins can view accounts' })
  }

  try {
    const result = await pool.query(
      `SELECT id, first_name, middle_name, last_name, dob, address, email, role, created_at, profile_image_url
       FROM clinic_users
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [req.tenantId]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching admin users:', error)
    res.status(500).json({ error: 'Failed to fetch accounts' })
  }
})

app.put('/api/admin/users/:id', extractTenant, async (req, res) => {
  if (req.userRole !== 'Admin') {
    return res.status(403).json({ error: 'Only admins can edit accounts' })
  }

  const { id } = req.params
  const {
    first_name,
    middle_name,
    last_name,
    dob,
    address,
    email,
    password
  } = req.body

  const normalizedEmail = email?.toLowerCase().trim()

  if (!first_name?.trim() || !last_name?.trim() || !dob || !address?.trim() || !normalizedEmail) {
    return res.status(400).json({ error: 'All required fields must be provided' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  const age = calculateAge(dob)
  if (age === null) {
    return res.status(400).json({ error: 'Invalid date of birth' })
  }

  if (age < 20) {
    return res.status(400).json({ error: 'Account holder must be at least 20 years old' })
  }

  const normalizedPassword = typeof password === 'string' ? password.trim() : ''
  if (normalizedPassword && normalizedPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' })
  }

  try {
    const targetResult = await pool.query(
      `SELECT id, role
       FROM clinic_users
       WHERE tenant_id = $1 AND id = $2
       LIMIT 1`,
      [req.tenantId, id]
    )

    if (targetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' })
    }

    const target = targetResult.rows[0]
    const canEditTarget = target.role === 'Nurse' || target.id === req.userId
    if (!canEditTarget) {
      return res.status(403).json({ error: 'Admins can only edit nurse accounts and their own account' })
    }

    const duplicateCheck = await pool.query(
      `SELECT id FROM clinic_users WHERE tenant_id = $1 AND LOWER(email) = LOWER($2) AND id <> $3 LIMIT 1`,
      [req.tenantId, normalizedEmail, id]
    )

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' })
    }

    const shouldUpdatePassword = Boolean(normalizedPassword)
    const result = shouldUpdatePassword
      ? await pool.query(
          `UPDATE clinic_users
           SET first_name = $1,
               middle_name = $2,
               last_name = $3,
               dob = $4,
               address = $5,
               email = $6,
               password_hash = $7
           WHERE tenant_id = $8 AND id = $9
           RETURNING id, first_name, middle_name, last_name, dob, address, email, role, created_at, profile_image_url`,
          [
            first_name.trim(),
            middle_name?.trim() || null,
            last_name.trim(),
            dob,
            address.trim(),
            normalizedEmail,
            hashPassword(normalizedPassword),
            req.tenantId,
            id
          ]
        )
      : await pool.query(
          `UPDATE clinic_users
           SET first_name = $1,
               middle_name = $2,
               last_name = $3,
               dob = $4,
               address = $5,
               email = $6
           WHERE tenant_id = $7 AND id = $8
           RETURNING id, first_name, middle_name, last_name, dob, address, email, role, created_at, profile_image_url`,
          [
            first_name.trim(),
            middle_name?.trim() || null,
            last_name.trim(),
            dob,
            address.trim(),
            normalizedEmail,
            req.tenantId,
            id
          ]
        )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' })
    }

    const updated = result.rows[0]
    const responsePayload = { account: updated }

    if (updated.id === req.userId) {
      const displayName = [updated.first_name, updated.middle_name, updated.last_name].filter(Boolean).join(' ')
      responsePayload.user = {
        id: updated.id,
        email: updated.email,
        tenantId: req.tenantId,
        role: updated.role,
        display_name: displayName,
        first_name: updated.first_name,
        middle_name: updated.middle_name,
        last_name: updated.last_name,
        dob: updated.dob,
        address: updated.address,
        profile_image_url: updated.profile_image_url,
        created_at: updated.created_at
      }
      responsePayload.token = createToken({
        tenantId: req.tenantId,
        userId: updated.id,
        role: updated.role,
        email: updated.email
      })
    }

    res.json(responsePayload)
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' })
    }

    console.error('Error updating account:', error)
    res.status(500).json({ error: 'Failed to update account' })
  }
})

app.post('/api/admin/users/:id/reveal-password', extractTenant, async (req, res) => {
  if (req.userRole !== 'Admin') {
    return res.status(403).json({ error: 'Only admins can reveal account passwords' })
  }

  const { id } = req.params

  try {
    const targetResult = await pool.query(
      `SELECT id, role, email
       FROM clinic_users
       WHERE tenant_id = $1 AND id = $2
       LIMIT 1`,
      [req.tenantId, id]
    )

    if (targetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' })
    }

    const target = targetResult.rows[0]
    if (target.role !== 'Nurse') {
      return res.status(403).json({ error: 'Only nurse account passwords can be viewed' })
    }

    const temporaryPassword = generateTemporaryPassword(10)
    const passwordHash = hashPassword(temporaryPassword)

    await pool.query(
      `UPDATE clinic_users
       SET password_hash = $1
       WHERE tenant_id = $2 AND id = $3`,
      [passwordHash, req.tenantId, id]
    )

    res.json({
      id,
      email: target.email,
      temporaryPassword
    })
  } catch (error) {
    console.error('Error revealing account password:', error)
    res.status(500).json({ error: 'Failed to reveal account password' })
  }
})

app.delete('/api/admin/users/:id', extractTenant, async (req, res) => {
  if (req.userRole !== 'Admin') {
    return res.status(403).json({ error: 'Only admins can delete accounts' })
  }

  const { id } = req.params

  try {
    const targetResult = await pool.query(
      `SELECT id, role
       FROM clinic_users
       WHERE tenant_id = $1 AND id = $2
       LIMIT 1`,
      [req.tenantId, id]
    )

    if (targetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' })
    }

    const target = targetResult.rows[0]
    const canDeleteTarget = target.role === 'Nurse' || target.id === req.userId
    if (!canDeleteTarget) {
      return res.status(403).json({ error: 'Admins can only delete nurse accounts and their own account' })
    }

    await pool.query(
      'DELETE FROM clinic_users WHERE tenant_id = $1 AND id = $2',
      [req.tenantId, id]
    )

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting account:', error)
    res.status(500).json({ error: 'Failed to delete account' })
  }
})

// ==================== STUDENTS ROUTES ====================

// GET all students
app.get('/api/students', extractTenant, async (req, res) => {
  try {
    console.log('Fetching students for tenant:', req.tenantId)
    const result = await pool.query(
      `SELECT s.*, 
              (SELECT MAX(visit_date) FROM clinic_visits WHERE student_id = s.id) as last_visit
       FROM students s
       WHERE tenant_id = $1
       ORDER BY full_name ASC`,
      [req.tenantId]
    )
    console.log('Found students:', result.rows.length)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching students:', error.message)
    console.error('Stack:', error.stack)
    res.status(500).json({ error: 'Failed to fetch students', details: error.message })
  }
})

// GET single student
app.get('/api/students/:id', extractTenant, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM students WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching student:', error)
    res.status(500).json({ error: 'Failed to fetch student' })
  }
})

// POST new student
app.post('/api/students', extractTenant, async (req, res) => {
  const {
    full_name,
    grade_level,
    section,
    sex,
    dob,
    contact_number,
    address,
    emergency_contact_person,
    emergency_contact_number,
    profile_image_url
  } = req.body

  try {
    const normalizedGrade = parseInt(grade_level)
    if (Number.isNaN(normalizedGrade) || normalizedGrade < 7 || normalizedGrade > 12) {
      return res.status(400).json({ error: 'Grade level must be between 7 and 12' })
    }

    let normalizedProfileImageUrl = null
    try {
      normalizedProfileImageUrl = normalizeImageDataUrl(profile_image_url)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }
      return res.status(400).json({ error: 'Invalid image format. Please upload a valid image file.' })
    }

    console.log('Creating student for tenant:', req.tenantId)
    console.log('Student data:', { full_name, grade_level, section })
    
    const result = await pool.query(
      `INSERT INTO students (
        tenant_id, id, full_name, grade_level, section, 
        sex, dob, contact_number, address, 
        emergency_contact_person, emergency_contact_number, profile_image_url
      ) VALUES ($1, gen_random_uuid(), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        req.tenantId,
        full_name,
        normalizedGrade,
        section,
        sex,
        dob,
        contact_number,
        address,
        emergency_contact_person,
        emergency_contact_number,
        normalizedProfileImageUrl
      ]
    )
    
    console.log('Student created successfully:', result.rows[0].id)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating student:', error.message)
    console.error('Error details:', error.detail)
    console.error('Stack:', error.stack)
    res.status(500).json({ error: 'Failed to create student', details: error.message })
  }
})

// PUT update student
app.put('/api/students/:id', extractTenant, async (req, res) => {
  try {
    const existingStudent = await pool.query(
      'SELECT * FROM students WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    )

    if (existingStudent.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }

    const current = existingStudent.rows[0]
    const next = {
      full_name: req.body.full_name ?? current.full_name,
      grade_level: req.body.grade_level ?? current.grade_level,
      section: req.body.section ?? current.section,
      sex: req.body.sex ?? current.sex,
      dob: req.body.dob ?? current.dob,
      contact_number: req.body.contact_number ?? current.contact_number,
      address: req.body.address ?? current.address,
      emergency_contact_person: req.body.emergency_contact_person ?? current.emergency_contact_person,
      emergency_contact_number: req.body.emergency_contact_number ?? current.emergency_contact_number,
      profile_image_url: req.body.profile_image_url !== undefined
        ? req.body.profile_image_url
        : current.profile_image_url
    }

    if (!next.full_name || !next.grade_level || !next.section || !next.sex || !next.dob) {
      return res.status(400).json({ error: 'Missing required student fields' })
    }

    if (!['Male', 'Female'].includes(next.sex)) {
      return res.status(400).json({ error: 'Invalid sex value. Must be Male or Female' })
    }

    const normalizedGradeLevel = parseInt(next.grade_level)
    if (Number.isNaN(normalizedGradeLevel) || normalizedGradeLevel < 7 || normalizedGradeLevel > 12) {
      return res.status(400).json({ error: 'Grade level must be between 7 and 12' })
    }

    let normalizedProfileImageUrl = null
    try {
      normalizedProfileImageUrl = normalizeImageDataUrl(next.profile_image_url)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }
      return res.status(400).json({ error: 'Invalid image format. Please upload a valid image file.' })
    }

    const result = await pool.query(
      `UPDATE students SET
        full_name = $1,
        grade_level = $2,
        section = $3,
        sex = $4,
        dob = $5,
        contact_number = $6,
        address = $7,
        emergency_contact_person = $8,
        emergency_contact_number = $9,
        profile_image_url = $10
      WHERE id = $11 AND tenant_id = $12
      RETURNING *`,
      [
        next.full_name,
        normalizedGradeLevel,
        next.section,
        next.sex,
        next.dob,
        next.contact_number,
        next.address,
        next.emergency_contact_person,
        next.emergency_contact_number,
        normalizedProfileImageUrl,
        req.params.id,
        req.tenantId
      ]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating student:', error)
    res.status(500).json({ error: 'Failed to update student' })
  }
})

// DELETE student
app.delete('/api/students/:id', extractTenant, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM students WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [req.params.id, req.tenantId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }
    
    res.json({ message: 'Student deleted successfully' })
  } catch (error) {
    console.error('Error deleting student:', error)
    res.status(500).json({ error: 'Failed to delete student' })
  }
})

// ==================== CLINIC VISITS ROUTES ====================

// GET visits for a student
app.get('/api/students/:id/visits', extractTenant, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM clinic_visits 
       WHERE student_id = $1 AND tenant_id = $2
       ORDER BY visit_date DESC, time_in DESC`,
      [req.params.id, req.tenantId]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching visits:', error)
    res.status(500).json({ error: 'Failed to fetch visits' })
  }
})

// GET all visits
app.get('/api/visits', extractTenant, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, s.full_name, s.grade_level, s.section, s.sex
       FROM clinic_visits v
       JOIN students s ON v.student_id = s.id
       WHERE v.tenant_id = $1
       ORDER BY v.visit_date DESC, v.time_in DESC`,
      [req.tenantId]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching visits:', error)
    res.status(500).json({ error: 'Failed to fetch visits' })
  }
})

// POST new visit
app.post('/api/visits', extractTenant, async (req, res) => {
  console.log('=== POST /api/visits called ===')
  console.log('Request body:', req.body)
  console.log('Tenant ID:', req.tenantId)
  
  const {
    student_id,
    visit_date,
    time_in,
    chief_complaint,
    blood_pressure,
    systolic,
    diastolic,
    temperature,
    assessment,
    intervention,
    medication_given,
    disposition,
    nurse_name
  } = req.body

  try {
    // Verify student exists and belongs to tenant
    console.log('Checking if student exists:', student_id)
    const studentCheck = await pool.query(
      'SELECT id FROM students WHERE id = $1 AND tenant_id = $2',
      [student_id, req.tenantId]
    )

    if (studentCheck.rows.length === 0) {
      console.error('Student not found!')
      return res.status(404).json({ error: 'Student not found' })
    }

    // Handle blood pressure - can come as "120/80" or separate systolic/diastolic
    let sys = systolic
    let dia = diastolic
    if (blood_pressure && blood_pressure.includes('/')) {
      const [s, d] = blood_pressure.split('/')
      sys = parseInt(s)
      dia = parseInt(d)
    }

    console.log('Inserting clinic visit...')
    const result = await pool.query(
      `INSERT INTO clinic_visits (
        tenant_id, id, student_id, visit_date, time_in, chief_complaint,
        systolic, diastolic, temperature,
        assessment, intervention, medication_given, disposition, nurse_name
      ) VALUES ($1, gen_random_uuid(), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        req.tenantId,
        student_id,
        visit_date,
        time_in,
        chief_complaint,
        sys,
        dia,
        temperature,
        assessment,
        intervention,
        medication_given,
        disposition,
        nurse_name
      ]
    )
    
    console.log('Visit created successfully!')
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating visit:', error.message)
    console.error('Error details:', error.detail)
    console.error('Stack:', error.stack)
    res.status(500).json({ error: 'Failed to create visit', details: error.message })
  }
})

// PUT update visit
app.put('/api/visits/:id', extractTenant, async (req, res) => {
  const {
    visit_date,
    time_in,
    chief_complaint,
    blood_pressure,
    systolic,
    diastolic,
    temperature,
    assessment,
    intervention,
    medication_given,
    disposition,
    nurse_name
  } = req.body

  try {
    let sys = systolic
    let dia = diastolic
    if (blood_pressure && blood_pressure.includes('/')) {
      const [s, d] = blood_pressure.split('/')
      sys = parseInt(s)
      dia = parseInt(d)
    }

    const result = await pool.query(
      `UPDATE clinic_visits SET
        visit_date = $1,
        time_in = $2,
        chief_complaint = $3,
        systolic = $4,
        diastolic = $5,
        temperature = $6,
        assessment = $7,
        intervention = $8,
        medication_given = $9,
        disposition = $10,
        nurse_name = $11
      WHERE id = $12 AND tenant_id = $13
      RETURNING *`,
      [
        visit_date,
        time_in,
        chief_complaint,
        sys,
        dia,
        temperature,
        assessment,
        intervention,
        medication_given,
        disposition,
        nurse_name,
        req.params.id,
        req.tenantId
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visit not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating visit:', error)
    res.status(500).json({ error: 'Failed to update visit' })
  }
})

// ==================== ANALYTICS ROUTES ====================

// GET dashboard statistics
app.get('/api/analytics/stats', extractTenant, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0]

    // Total students
    const studentsResult = await pool.query(
      'SELECT COUNT(*) as total FROM students WHERE tenant_id = $1',
      [req.tenantId]
    )

    // Visits today
    const visitsTodayResult = await pool.query(
      'SELECT COUNT(*) as total FROM clinic_visits WHERE tenant_id = $1 AND visit_date = $2',
      [req.tenantId, today]
    )

    // Visits this month
    const visitsMonthResult = await pool.query(
      'SELECT COUNT(*) as total FROM clinic_visits WHERE tenant_id = $1 AND visit_date >= $2',
      [req.tenantId, firstDayOfMonth]
    )

    // Most common illness
    const commonIllnessResult = await pool.query(
      `SELECT chief_complaint, COUNT(*) as count
       FROM clinic_visits
       WHERE tenant_id = $1 AND visit_date >= $2
       GROUP BY chief_complaint
       ORDER BY count DESC
       LIMIT 1`,
      [req.tenantId, firstDayOfMonth]
    )

    res.json({
      totalStudents: parseInt(studentsResult.rows[0].total),
      visitsToday: parseInt(visitsTodayResult.rows[0].total),
      visitsThisMonth: parseInt(visitsMonthResult.rows[0].total),
      commonIllness: commonIllnessResult.rows[0]?.chief_complaint || 'N/A'
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

// GET illness frequency data
app.get('/api/analytics/illness-frequency', extractTenant, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT chief_complaint, COUNT(*) as count
       FROM clinic_visits
       WHERE tenant_id = $1
       GROUP BY chief_complaint
       ORDER BY count DESC
       LIMIT 10`,
      [req.tenantId]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching illness frequency:', error)
    res.status(500).json({ error: 'Failed to fetch illness frequency' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

if (!process.env.VERCEL) {
  ensureInitialized()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🏥 School Clinic Management System API running on port ${PORT}`)
      })
    })
    .catch((error) => {
      console.error('Failed to start server:', error)
      process.exit(1)
    })
}

export default app
