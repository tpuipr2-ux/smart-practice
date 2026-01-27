-- Create database and extensions
\c smart_practice;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    description TEXT,
    invite_code VARCHAR(10) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'student', -- student, partner, curator, admin
    major_id INTEGER,
    course INTEGER,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS majors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vacancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    position VARCHAR(255),
    major_ids INTEGER[], -- Array of major IDs
    slots_count INTEGER NOT NULL DEFAULT 1,
    deadline_date DATE NOT NULL,
    reward TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, moderation, active, archived
    header_bg_color VARCHAR(7), -- Hex color for header background
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vacancy_id, student_id)
);

CREATE TABLE IF NOT EXISTS export_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, sent
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default majors
INSERT INTO majors (name) VALUES 
    ('Бурение нефтяных и газовых скважин'),
    ('Разработка и эксплуатация нефтяных и газовых месторождений'),
    ('Эксплуатация и обслуживание объектов транспорта и хранения нефти, газа и продуктов переработки'),
    ('Технологические машины и оборудование')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_vacancies_status ON vacancies(status);
CREATE INDEX idx_vacancies_partner_id ON vacancies(partner_id);
CREATE INDEX idx_applications_vacancy_id ON applications(vacancy_id);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_export_requests_vacancy_id ON export_requests(vacancy_id);