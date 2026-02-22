"""
Комментарии к статьям: получить список, добавить, одобрить/отклонить (только для авторизованных).
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


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    user_id = event.get("headers", {}).get("X-User-Id")
    params = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}")

    # GET /comments?article_id=X — комментарии к статье
    if method == "GET":
        article_id = params.get("article_id")
        status_filter = params.get("status", "approved")
        where = f"WHERE cm.status = '{status_filter}'"
        if article_id:
            where += f" AND cm.article_id = {int(article_id)}"
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT cm.id, cm.article_id, cm.text, cm.status, cm.created_at,
                       u.first_name, u.username, u.id as author_id
                FROM {SCHEMA}.comments cm
                LEFT JOIN {SCHEMA}.users u ON cm.author_id = u.id
                {where}
                ORDER BY cm.created_at ASC""",
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        comments = [
            {
                "id": r[0], "article_id": r[1], "text": r[2], "status": r[3],
                "created_at": r[4].isoformat() if r[4] else None,
                "author_name": r[5] or r[6] or "Гражданин ОГФ",
                "author_id": r[7],
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(comments, ensure_ascii=False)}

    # POST / — добавить комментарий (только авторизованные)
    if method == "POST":
        if not user_id:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Войдите через Telegram для комментирования"})}
        article_id = body.get("article_id")
        text = body.get("text", "").strip()
        if not article_id or not text:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "missing fields"})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.comments (article_id, author_id, text, status) VALUES (%s, %s, %s, 'pending') RETURNING id",
            (article_id, user_id, text)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id, "status": "pending"})}

    # PUT /moderate — одобрить/отклонить комментарий (только админ)
    if method == "PUT" and path.endswith("/moderate"):
        if not is_admin(user_id):
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}
        comment_id = body.get("comment_id")
        action = body.get("action")
        if not comment_id or action not in ("approve", "reject"):
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "invalid"})}
        status = "approved" if action == "approve" else "rejected"
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.comments SET status=%s WHERE id=%s", (status, comment_id))
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "not found"})}
