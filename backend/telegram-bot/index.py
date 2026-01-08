import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''Telegram webhook для обработки сообщений бота'''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        if 'message' not in body:
            return {'statusCode': 200, 'body': json.dumps({'ok': True})}
        
        message = body['message']
        chat_id = message['chat']['id']
        user_id = message['from']['id']
        username = message['from'].get('username', '')
        first_name = message['from'].get('first_name', '')
        text = message.get('text', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            f"INSERT INTO {os.environ['MAIN_DB_SCHEMA']}.users (telegram_id, username, first_name) "
            "VALUES (%s, %s, %s) ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username",
            (user_id, username, first_name)
        )
        conn.commit()
        
        if text.startswith('/start'):
            send_message(chat_id, 
                "🎬 Привет! Я помогу скачать видео из Pinterest.\n\n"
                "Просто отправь мне ссылку на видео, например:\n"
                "https://pinterest.com/pin/123456789/\n\n"
                "И я пришлю тебе видео!"
            )
        
        elif 'pinterest.com' in text.lower() or 'pin.it' in text.lower():
            send_message(chat_id, "⏳ Скачиваю видео...")
            
            video_data = download_pinterest_video(text)
            
            if video_data:
                cursor.execute(
                    f"SELECT id FROM {os.environ['MAIN_DB_SCHEMA']}.users WHERE telegram_id = %s",
                    (user_id,)
                )
                db_user_id = cursor.fetchone()[0]
                
                cursor.execute(
                    f"INSERT INTO {os.environ['MAIN_DB_SCHEMA']}.downloads "
                    "(user_id, pinterest_url, video_url, thumbnail_url, title) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (db_user_id, text, video_data['video_url'], 
                     video_data['thumbnail'], video_data['title'])
                )
                conn.commit()
                
                update_stats(cursor, conn)
                
                send_video(chat_id, video_data['video_url'], video_data['title'])
            else:
                send_message(chat_id, 
                    "❌ Не удалось скачать видео.\n"
                    "Проверьте ссылку или попробуйте позже."
                )
        
        else:
            send_message(chat_id, 
                "⚠️ Отправьте ссылку на видео Pinterest.\n"
                "Пример: https://pinterest.com/pin/123456789/"
            )
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True})
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def send_message(chat_id: int, text: str):
    import urllib.request
    import urllib.parse
    
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    data = urllib.parse.urlencode({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }).encode()
    
    req = urllib.request.Request(url, data=data)
    urllib.request.urlopen(req)

def send_video(chat_id: int, video_url: str, caption: str):
    import urllib.request
    import urllib.parse
    
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    url = f"https://api.telegram.org/bot{bot_token}/sendVideo"
    
    data = urllib.parse.urlencode({
        'chat_id': chat_id,
        'video': video_url,
        'caption': caption
    }).encode()
    
    req = urllib.request.Request(url, data=data)
    urllib.request.urlopen(req)

def download_pinterest_video(pinterest_url: str) -> dict:
    import urllib.request
    import re
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        req = urllib.request.Request(pinterest_url, headers=headers)
        response = urllib.request.urlopen(req)
        html = response.read().decode('utf-8')
        
        video_pattern = r'"url":"(https://[^"]+\.mp4[^"]*)"'
        video_match = re.search(video_pattern, html)
        
        thumbnail_pattern = r'"image_large_url":"([^"]+)"'
        thumbnail_match = re.search(thumbnail_pattern, html)
        
        title_pattern = r'"title":"([^"]+)"'
        title_match = re.search(title_pattern, html)
        
        if video_match:
            video_url = video_match.group(1).replace('\\/', '/')
            thumbnail = thumbnail_match.group(1).replace('\\/', '/') if thumbnail_match else ''
            title = title_match.group(1) if title_match else 'Pinterest Video'
            
            return {
                'video_url': video_url,
                'thumbnail': thumbnail,
                'title': title
            }
        
        return None
        
    except Exception as e:
        print(f"Download error: {e}")
        return None

def update_stats(cursor, conn):
    today = datetime.now().date()
    
    cursor.execute(
        f"INSERT INTO {os.environ['MAIN_DB_SCHEMA']}.stats (date, total_downloads, unique_users) "
        "VALUES (%s, 1, 1) "
        "ON CONFLICT (date) DO UPDATE SET "
        "total_downloads = stats.total_downloads + 1",
        (today,)
    )
    conn.commit()
