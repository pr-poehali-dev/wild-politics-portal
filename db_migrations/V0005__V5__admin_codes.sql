CREATE TABLE t_p60467862_wild_politics_portal.admin_codes (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
)
