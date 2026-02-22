CREATE TABLE IF NOT EXISTS t_p60467862_wild_politics_portal.channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100) DEFAULT 'Newspaper',
    color VARCHAR(100) DEFAULT 'bg-blue-700',
    verification_type VARCHAR(50) DEFAULT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_by INT REFERENCES t_p60467862_wild_politics_portal.users(id),
    created_at TIMESTAMP DEFAULT NOW()
)
