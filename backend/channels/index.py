"""
CRUD для каналов: получить список, создать канал, верифицировать канал (только для админов).
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

VERIFICATION_TYPES = {
    "government": "Государственный",
    "political": "Политический",
    "medical": "Медицинский",
    "news": "Новостной",
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
    body = json.loads(event.get("body") or "{}")

    # GET /channels — список каналов
    if method == "GET" and not any(x in path for x in ["/verify", "/create"]):
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT c.id, c.name, c.description, c.icon, c.color,
                       c.is_verified, c.verification_type, c.created_at,
                       u.first_name, u.username,
                       COUNT(DISTINCT a.id) as post_count
                FROM {SCHEMA}.channels c
                LEFT JOIN {SCHEMA}.users u ON c.created_by = u.id
                LEFT JOIN {SCHEMA}.articles a ON a.channel_id = c.id AND a.status = 'published'
                GROUP BY c.id, u.first_name, u.username
                ORDER BY c.is_verified DESC, c.created_at ASC"""
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        channels = [
            {
                "id": r[0], "name": r[1], "description": r[2],
                "icon": r[3], "color": r[4], "is_verified": r[5],
                "verification_type": r[6],
                "verification_label": VERIFICATION_TYPES.get(r[6]) if r[6] else None,
                "created_at": r[7].isoformat() if r[7] else None,
                "created_by": r[8] or r[9] or "ГТРК ОГФ",
                "posts": r[10],
                "subscribers": 0,
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(channels, ensure_ascii=False)}

    # POST /channels/create — создать канал
    if method == "POST" and path.endswith("/create"):
        if not user_id:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}
        name = body.get("name", "").strip()
        description = body.get("description", "").strip()
        icon = body.get("icon", "Newspaper")
        color = body.get("color", "bg-blue-700")
        if not name:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "name required"})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""INSERT INTO {SCHEMA}.channels (name, description, icon, color, created_by)
                VALUES (%s, %s, %s, %s, %s) RETURNING id""",
            (name, description, icon, color, user_id)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id, "name": name})}

    # PUT /channels/verify — верифицировать канал (только админ)
    if method == "PUT" and path.endswith("/verify"):
        if not is_admin(user_id):
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}
        channel_id = body.get("channel_id")
        vtype = body.get("verification_type")
        is_verified = body.get("is_verified", True)
        if not channel_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "channel_id required"})}
        if is_verified and vtype not in VERIFICATION_TYPES:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "invalid verification_type"})}
        conn = get_conn()
        cur = conn.cursor()
        if is_verified:
            cur.execute(
                f"UPDATE {SCHEMA}.channels SET is_verified=TRUE, verification_type=%s WHERE id=%s",
                (vtype, channel_id)
            )
        else:
            cur.execute(
                f"UPDATE {SCHEMA}.channels SET is_verified=FALSE, verification_type=NULL WHERE id=%s",
                (channel_id,)
            )
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "not found"})}
