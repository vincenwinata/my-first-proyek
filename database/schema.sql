CREATE DATABASE IF NOT EXISTS book_library;
USE book_library;

-- Table books
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_volume_id VARCHAR(100) UNIQUE,
    title VARCHAR(255) NOT NULL,
    authors TEXT,
    category VARCHAR(100),
    publisher VARCHAR(255),
    published_date VARCHAR(30),
    isbn VARCHAR(30),
    description TEXT,
    cover_url TEXT,
    reading_status ENUM('To Read', 'Reading', 'Completed') NOT NULL DEFAULT 'To Read',
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    rating TINYINT NULL,
    source ENUM('manual', 'google_books') NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
);

-- Table reading_history
CREATE TABLE IF NOT EXISTS reading_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    note TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);
