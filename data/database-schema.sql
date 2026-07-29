-- Global NursePrep database-ready schema.
-- Designed for PostgreSQL. MySQL can use equivalent VARCHAR/TEXT/JSON columns.

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(220) NOT NULL UNIQUE,
    role VARCHAR(32) NOT NULL DEFAULT 'student',
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_iterations INTEGER NOT NULL DEFAULT 210000,
    password_version INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(96) PRIMARY KEY,
    title VARCHAR(220) NOT NULL,
    category VARCHAR(120) NOT NULL,
    instructor VARCHAR(180),
    price_cents INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(12) NOT NULL DEFAULT 'KES',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
    id VARCHAR(96) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    course_id VARCHAR(96) NOT NULL REFERENCES courses(id),
    status VARCHAR(32) NOT NULL DEFAULT 'locked',
    progress_json JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(96) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    course_id VARCHAR(96) REFERENCES courses(id),
    gateway VARCHAR(48) NOT NULL,
    reference VARCHAR(120) NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(12) NOT NULL DEFAULT 'KES',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (gateway, reference)
);

CREATE TABLE IF NOT EXISTS learning_states (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id),
    state_json JSON NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);
