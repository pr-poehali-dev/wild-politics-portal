CREATE TABLE t_p60467862_wild_politics_portal.comments (
    id SERIAL PRIMARY KEY,
    article_id INT REFERENCES t_p60467862_wild_politics_portal.articles(id),
    author_id INT REFERENCES t_p60467862_wild_politics_portal.users(id),
    text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
)
