"""
CRUD для статей: лента, детальная страница, создание, модерация (одобрение/отклонение).
"""
import json
import os
import psycopg2

SCHEMA = "t_p60467862_wild_politics_portal"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def is_admin(user_id):
    if not user_id:
        return False
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"SELECT is_admin FROM {SCHEMA}.users WHERE id=%s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row and row[0]


def article_row_to_dict(r):
    return {
        "id": r[0], "title": r[1], "content": r[2], "excerpt": r[3],
        "channel_id": r[4], "channel_name": r[5], "channel_color": r[6],
        "channel_icon": r[7], "channel_verified": r[8], "channel_verification_type": r[9],
        "author_id": r[10],
        "author_name": r[11] or r[12] or "Гражданин ОГФ",
        "status": r[13], "views": r[14], "is_breaking": r[15],
        "created_at": r[16].isoformat() if r[16] else None,
        "comment_count": r[17],
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    user_id = event.get("headers", {}).get("X-User-Id")
    params = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}")

    BASE_QUERY = f"""
        SELECT a.id, a.title, a.content, a.excerpt,
               a.channel_id, c.name, c.color, c.icon, c.is_verified, c.verification_type,
               a.author_id, u.first_name, u.username,
               a.status, a.views, a.is_breaking, a.created_at,
               COUNT(DISTINCT cm.id) FILTER (WHERE cm.status='approved') as comment_count
        FROM {SCHEMA}.articles a
        LEFT JOIN {SCHEMA}.channels c ON a.channel_id = c.id
        LEFT JOIN {SCHEMA}.users u ON a.author_id = u.id
        LEFT JOIN {SCHEMA}.comments cm ON cm.article_id = a.id
    """

    # GET / — лента публикаций
    if method == "GET" and path.endswith("/articles") or path.endswith("/articles/"):
        status_filter = params.get("status", "published")
        channel_id = params.get("channel_id")
        where = f"WHERE a.status = '{status_filter}'"
        if channel_id:
            where += f" AND a.channel_id = {int(channel_id)}"
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(BASE_QUERY + where + " GROUP BY a.id, c.name, c.color, c.icon, c.is_verified, c.verification_type, u.first_name, u.username ORDER BY a.is_breaking DESC, a.created_at DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps([article_row_to_dict(r) for r in rows], ensure_ascii=False)}

    # GET /articles/{id} — одна статья
    if method == "GET":
        parts = path.rstrip("/").split("/")
        article_id = parts[-1]
        if article_id.isdigit():
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.articles SET views=views+1 WHERE id=%s", (article_id,))
            cur.execute(BASE_QUERY + f"WHERE a.id={article_id} GROUP BY a.id, c.name, c.color, c.icon, c.is_verified, c.verification_type, u.first_name, u.username")
            row = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            if not row:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "not found"})}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps(article_row_to_dict(row), ensure_ascii=False)}

    # POST / — создать статью
    if method == "POST" and (path.endswith("/articles") or path.endswith("/articles/")):
        if not user_id:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}
        title = body.get("title", "").strip()
        content = body.get("content", "").strip()
        channel_id = body.get("channel_id")
        if not title or not content or not channel_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "missing fields"})}
        excerpt = content[:200] + ("..." if len(content) > 200 else "")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""INSERT INTO {SCHEMA}.articles (title, content, excerpt, channel_id, author_id, status)
                VALUES (%s, %s, %s, %s, %s, 'pending') RETURNING id""",
            (title, content, excerpt, channel_id, user_id)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id, "status": "pending"})}

    # PUT /articles/{id}/moderate — одобрить/отклонить
    if method == "PUT" and "/moderate" in path:
        if not is_admin(user_id):
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}
        parts = path.rstrip("/").split("/")
        article_id = None
        for i, p in enumerate(parts):
            if p == "moderate" and i > 0:
                article_id = parts[i - 1]
        action = body.get("action")
        if not article_id or action not in ("approve", "reject"):
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "invalid"})}
        status = "published" if action == "approve" else "rejected"
        is_breaking = body.get("is_breaking", False)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.articles SET status=%s, is_breaking=%s WHERE id=%s",
            (status, is_breaking, article_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "status": status})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "not found"})}
