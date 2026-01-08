-- Таблица пользователей бота
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица скачанных видео
CREATE TABLE IF NOT EXISTS downloads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    pinterest_url TEXT NOT NULL,
    video_url TEXT,
    thumbnail_url TEXT,
    title VARCHAR(500),
    file_size BIGINT,
    duration INTEGER,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для статистики
CREATE TABLE IF NOT EXISTS stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_downloads INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    total_size BIGINT DEFAULT 0
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_date ON downloads(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_stats_date ON stats(date);