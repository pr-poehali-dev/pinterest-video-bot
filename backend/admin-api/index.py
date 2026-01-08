import json
import os
import psycopg2
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    '''API для админ-панели: статистика, история скачиваний, фильтры'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Id'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    admin_id = headers.get('x-admin-id') or headers.get('X-Admin-Id')
    
    expected_admin_id = os.environ.get('ADMIN_TELEGRAM_ID', '')
    
    if not admin_id or str(admin_id) != str(expected_admin_id):
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query_params = event.get('queryStringParameters') or {}
        endpoint = query_params.get('endpoint', 'stats')
        
        if endpoint == 'stats':
            data = get_statistics(cursor, query_params)
        elif endpoint == 'downloads':
            data = get_downloads(cursor, query_params)
        elif endpoint == 'users':
            data = get_users(cursor, query_params)
        else:
            data = get_statistics(cursor, query_params)
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(data, default=str)
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_statistics(cursor, params):
    schema = os.environ['MAIN_DB_SCHEMA']
    period = params.get('period', '7')
    
    days_ago = datetime.now() - timedelta(days=int(period))
    
    cursor.execute(f'''
        SELECT 
            COUNT(*) as total_downloads,
            COUNT(DISTINCT user_id) as unique_users,
            SUM(file_size) as total_size
        FROM {schema}.downloads
        WHERE downloaded_at >= %s
    ''', (days_ago,))
    
    totals = cursor.fetchone()
    
    cursor.execute(f'''
        SELECT 
            DATE(downloaded_at) as date,
            COUNT(*) as count
        FROM {schema}.downloads
        WHERE downloaded_at >= %s
        GROUP BY DATE(downloaded_at)
        ORDER BY date DESC
    ''', (days_ago,))
    
    daily_stats = [{'date': str(row[0]), 'count': row[1]} for row in cursor.fetchall()]
    
    cursor.execute(f'''
        SELECT 
            d.title,
            COUNT(*) as download_count
        FROM {schema}.downloads d
        WHERE d.downloaded_at >= %s AND d.title IS NOT NULL
        GROUP BY d.title
        ORDER BY download_count DESC
        LIMIT 10
    ''', (days_ago,))
    
    top_videos = [{'title': row[0], 'count': row[1]} for row in cursor.fetchall()]
    
    return {
        'total_downloads': totals[0] or 0,
        'unique_users': totals[1] or 0,
        'total_size': totals[2] or 0,
        'daily_stats': daily_stats,
        'top_videos': top_videos
    }

def get_downloads(cursor, params):
    schema = os.environ['MAIN_DB_SCHEMA']
    
    search = params.get('search', '')
    date_from = params.get('date_from', '')
    date_to = params.get('date_to', '')
    limit = int(params.get('limit', '50'))
    offset = int(params.get('offset', '0'))
    
    conditions = []
    values = []
    
    if search:
        conditions.append("(d.title ILIKE %s OR d.pinterest_url ILIKE %s)")
        search_pattern = f'%{search}%'
        values.extend([search_pattern, search_pattern])
    
    if date_from:
        conditions.append("d.downloaded_at >= %s")
        values.append(date_from)
    
    if date_to:
        conditions.append("d.downloaded_at <= %s")
        values.append(date_to)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    query = f'''
        SELECT 
            d.id,
            d.pinterest_url,
            d.video_url,
            d.thumbnail_url,
            d.title,
            d.file_size,
            d.downloaded_at,
            u.username,
            u.first_name
        FROM {schema}.downloads d
        LEFT JOIN {schema}.users u ON d.user_id = u.id
        {where_clause}
        ORDER BY d.downloaded_at DESC
        LIMIT %s OFFSET %s
    '''
    
    values.extend([limit, offset])
    
    cursor.execute(query, values)
    
    downloads = []
    for row in cursor.fetchall():
        downloads.append({
            'id': row[0],
            'pinterest_url': row[1],
            'video_url': row[2],
            'thumbnail_url': row[3],
            'title': row[4],
            'file_size': row[5],
            'downloaded_at': row[6],
            'username': row[7],
            'first_name': row[8]
        })
    
    cursor.execute(f'''
        SELECT COUNT(*) 
        FROM {schema}.downloads d
        {where_clause}
    ''', values[:-2])
    
    total = cursor.fetchone()[0]
    
    return {
        'downloads': downloads,
        'total': total,
        'limit': limit,
        'offset': offset
    }

def get_users(cursor, params):
    schema = os.environ['MAIN_DB_SCHEMA']
    
    cursor.execute(f'''
        SELECT 
            u.id,
            u.telegram_id,
            u.username,
            u.first_name,
            u.is_admin,
            u.created_at,
            COUNT(d.id) as downloads_count
        FROM {schema}.users u
        LEFT JOIN {schema}.downloads d ON u.id = d.user_id
        GROUP BY u.id
        ORDER BY downloads_count DESC
        LIMIT 100
    ''')
    
    users = []
    for row in cursor.fetchall():
        users.append({
            'id': row[0],
            'telegram_id': row[1],
            'username': row[2],
            'first_name': row[3],
            'is_admin': row[4],
            'created_at': row[5],
            'downloads_count': row[6]
        })
    
    return {'users': users}