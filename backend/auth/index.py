"""
Авторизация через Telegram: верификация данных виджета, регистрация/вход пользователя.
Также: запрос кода администратора и его проверка.
"""
import json
import os
import hashlib
import hmac
import random
import string
import psycopg2
from datetime import datetime, timedelta

SCHEMA = "t_p60467862_wild_politics_portal"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def verify_telegram_data(data: dict) -> bool:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token:
        return False
    check_hash = data.pop("hash", "")
    data_check_arr = sorted([f"{k}={v}" for k, v in data.items()])
    data_check_string = "\n".join(data_check_arr)
    secret_key = hashlib.sha256(token.encode()).digest()
    computed = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return computed == check_hash


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    body = json.loads(event.get("body") or "{}")

    # POST /auth/telegram — вход через Telegram Widget
    if path.endswith("/telegram"):
        tg = dict(body)
        tg_id = tg.get("id")
        if not tg_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "no id"})}

        # Верифицируем данные от Telegram
        valid = verify_telegram_data(tg)
        # В dev режиме без токена принимаем как есть
        if not valid and os.environ.get("TELEGRAM_BOT_TOKEN"):
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid telegram data"})}

        conn = get_conn()
        cur = conn.cursor()
        # Upsert пользователя
        cur.execute(
            f"""INSERT INTO {SCHEMA}.users (telegram_id, username, first_name, last_name, photo_url)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (telegram_id) DO UPDATE
                SET username=EXCLUDED.username, first_name=EXCLUDED.first_name,
                    last_name=EXCLUDED.last_name, photo_url=EXCLUDED.photo_url
                RETURNING id, is_admin""",
            (tg_id, body.get("username"), body.get("first_name"), body.get("last_name"), body.get("photo_url"))
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "user_id": row[0],
                "telegram_id": tg_id,
                "username": body.get("username"),
                "first_name": body.get("first_name"),
                "last_name": body.get("last_name"),
                "photo_url": body.get("photo_url"),
                "is_admin": row[1],
            })
        }

    # POST /auth/request-admin-code — запросить код для входа как админ
    if path.endswith("/request-admin-code"):
        tg_id = body.get("telegram_id")
        if not tg_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "no telegram_id"})}

        # Проверяем что это разрешённый администратор
        admin_ids_str = os.environ.get("ADMIN_TELEGRAM_IDS", "")
        allowed = [int(x.strip()) for x in admin_ids_str.split(",") if x.strip().isdigit()]
        if int(tg_id) not in allowed:
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "not allowed"})}

        code = "".join(random.choices(string.digits, k=6))
        expires = datetime.utcnow() + timedelta(minutes=10)

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.admin_codes (telegram_id, code, expires_at) VALUES (%s, %s, %s)",
            (tg_id, code, expires)
        )
        conn.commit()
        cur.close()
        conn.close()

        # Отправляем код через Telegram бота
        token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
        if token:
            import urllib.request
            msg = f"🔐 Ваш код администратора ГТРК ОГФ: *{code}*\n\nДействителен 10 минут."
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            payload = json.dumps({"chat_id": tg_id, "text": msg, "parse_mode": "Markdown"}).encode()
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
            urllib.request.urlopen(req)

        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"sent": True})}

    # POST /auth/verify-admin-code — проверить код администратора
    if path.endswith("/verify-admin-code"):
        tg_id = body.get("telegram_id")
        code = body.get("code", "").strip()
        user_id = body.get("user_id")
        if not tg_id or not code:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "missing fields"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT id FROM {SCHEMA}.admin_codes
                WHERE telegram_id=%s AND code=%s AND used=FALSE AND expires_at > NOW()
                ORDER BY created_at DESC LIMIT 1""",
            (tg_id, code)
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid or expired code"})}

        cur.execute(f"UPDATE {SCHEMA}.admin_codes SET used=TRUE WHERE id=%s", (row[0],))
        if user_id:
            cur.execute(f"UPDATE {SCHEMA}.users SET is_admin=TRUE WHERE id=%s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()

        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"is_admin": True})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "not found"})}
