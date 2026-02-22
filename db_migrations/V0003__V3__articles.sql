CREATE TABLE t_p60467862_wild_politics_portal.articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    channel_id INT REFERENCES t_p60467862_wild_politics_portal.channels(id),
    author_id INT REFERENCES t_p60467862_wild_politics_portal.users(id),
    status VARCHAR(20) DEFAULT 'pending',
    views INT DEFAULT 0,
    is_breaking BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
)
