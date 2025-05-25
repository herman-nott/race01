USE race01_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(100) NOT NULL,
    wins_counter INT NOT NULL,
    losses_counter INT NOT NULL
);