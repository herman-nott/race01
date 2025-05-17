CREATE DATABASE IF NOT EXISTS rece01_db;
CREATE USER IF NOT EXISTS 'hpohosian'@'localhost' IDENTIFIED BY 'securepass';
GRANT ALL PRIVILEGES ON rece01_db.* TO 'hpohosian'@'localhost';