CREATE DATABASE IF NOT EXISTS race01_db;
CREATE USER IF NOT EXISTS 'hpohosian'@'localhost' IDENTIFIED BY 'securepass';
GRANT ALL PRIVILEGES ON race01_db.* TO 'hpohosian'@'localhost';