CREATE DATABASE IF NOT EXISTS pgsoft CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE pgsoft;

CREATE TABLE agents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agentcode VARCHAR(64) NOT NULL,
  agentToken VARCHAR(64) NOT NULL UNIQUE,
  secretKey VARCHAR(64) NOT NULL,
  callbackurl VARCHAR(255) NOT NULL,
  probganho VARCHAR(8) DEFAULT '30',
  probbonus VARCHAR(8) DEFAULT '5',
  probganhortp VARCHAR(8) DEFAULT '15',
  probganhoinfluencer VARCHAR(8) DEFAULT '50',
  probbonusinfluencer VARCHAR(8) DEFAULT '10',
  probganhoaposta VARCHAR(8) DEFAULT '35',
  probganhosaldo VARCHAR(8) DEFAULT '25'
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  atk VARCHAR(64) NOT NULL UNIQUE,
  saldo DECIMAL(12,2) DEFAULT 0,
  agentid INT NOT NULL,
  rtp DECIMAL(6,2) DEFAULT 0,
  valorganho DECIMAL(14,2) DEFAULT 0,
  valorapostado DECIMAL(14,2) DEFAULT 0,
  valordebitado DECIMAL(14,2) DEFAULT 0,
  linha_ganho INT DEFAULT 0,
  isinfluencer TINYINT(1) DEFAULT 0,
  UNIQUE KEY uq_user_agent (username, agentid)
);

CREATE TABLE spins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  game_code VARCHAR(64) NOT NULL,
  json LONGTEXT,
  UNIQUE KEY uq_spin_user (user_id)
);

CREATE TABLE spins_inicial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_code VARCHAR(64) NOT NULL UNIQUE,
  json LONGTEXT
);

CREATE TABLE calls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  iduser INT NOT NULL,
  gamecode VARCHAR(64) NOT NULL,
  jsonname VARCHAR(32),
  bycall VARCHAR(32) DEFAULT 'system',
  steps INT DEFAULT NULL,
  status VARCHAR(16) DEFAULT 'pending',
  aw DECIMAL(14,2) DEFAULT 0
);
