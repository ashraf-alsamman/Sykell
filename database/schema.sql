-- Database schema for Website Crawler application

CREATE DATABASE IF NOT EXISTS crawler_db;
USE crawler_db;

-- URLs table to store websites to be crawled
CREATE TABLE IF NOT EXISTS urls (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(2048) NOT NULL,
    status ENUM('queued', 'running', 'completed', 'failed') DEFAULT 'queued',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    UNIQUE KEY unique_url (url(255))
);

-- Analysis results table
CREATE TABLE IF NOT EXISTS analysis_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    url_id BIGINT NOT NULL,
    html_version VARCHAR(10) NULL,
    page_title VARCHAR(500) NULL,
    h1_count INT DEFAULT 0,
    h2_count INT DEFAULT 0,
    h3_count INT DEFAULT 0,
    h4_count INT DEFAULT 0,
    h5_count INT DEFAULT 0,
    h6_count INT DEFAULT 0,
    internal_links_count INT DEFAULT 0,
    external_links_count INT DEFAULT 0,
    broken_links_count INT DEFAULT 0,
    has_login_form BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE,
    INDEX idx_url_id (url_id)
);

-- Broken links table
CREATE TABLE IF NOT EXISTS broken_links (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    url_id BIGINT NOT NULL,
    link_url VARCHAR(2048) NOT NULL,
    status_code INT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE,
    INDEX idx_url_id (url_id),
    INDEX idx_status_code (status_code)
);

-- Internal links table for detailed tracking
CREATE TABLE IF NOT EXISTS internal_links (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    url_id BIGINT NOT NULL,
    link_url VARCHAR(2048) NOT NULL,
    link_text VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE,
    INDEX idx_url_id (url_id)
);

-- External links table for detailed tracking
CREATE TABLE IF NOT EXISTS external_links (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    url_id BIGINT NOT NULL,
    link_url VARCHAR(2048) NOT NULL,
    link_text VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE,
    INDEX idx_url_id (url_id)
);

-- Users table for authentication (simple implementation)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default user for testing
INSERT INTO users (username, password_hash) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'); -- password: password

-- Create indexes for better performance
CREATE INDEX idx_urls_status_created ON urls(status, created_at);
CREATE INDEX idx_analysis_url_id ON analysis_results(url_id);
CREATE INDEX idx_broken_links_url_id ON broken_links(url_id); 