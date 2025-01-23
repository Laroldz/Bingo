// initDb.js
import mysql from 'mysql2/promise'; // Use promise-based connections for better async handling

(async () => {
  try {
    // 1. Connect to MySQL (adjust host/user/password as necessary)
    const connection = await mysql.createConnection({
      host: 'database-1.cfm4u4w8acn9.us-east-2.rds.amazonaws.com',
      user: 'admin',
      password: 'kenwong94',
      multipleStatements: true // Allow executing multiple statements at once
    });

    console.log('Connected to MySQL!');

    // 2. SQL script: create a "bingo" DB and the tables
    const createDbAndTables = `
      -- Create and use database (if not exists)
      CREATE DATABASE IF NOT EXISTS bingo
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci;
      USE bingo;

      -- Drop tables if they exist (for a clean slate)
      DROP TABLE IF EXISTS BingoItems;
      DROP TABLE IF EXISTS BingoSheets;
      DROP TABLE IF EXISTS Users;

      -- Create Users table
      CREATE TABLE Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50),
        password VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=INNODB;

      -- Create BingoSheets table
      CREATE TABLE BingoSheets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id VARCHAR(100) NOT NULL,
        owner_username VARCHAR(50),
        title VARCHAR(100),
        description TEXT,
        share_token VARCHAR(255),
        has_free_space BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=INNODB;

      -- Create BingoItems table
      CREATE TABLE BingoItems (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sheet_id INT NOT NULL,
        content VARCHAR(255),
        position INT,
        is_marked BOOLEAN DEFAULT FALSE,
        CONSTRAINT fk_bingoItems_bingoSheets
          FOREIGN KEY (sheet_id) REFERENCES BingoSheets(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      ) ENGINE=INNODB;

    `;

    // 3. Run the SQL
    await connection.query(createDbAndTables);
    console.log('Database and tables created successfully!');

    await connection.end();
  } catch (error) {
    console.error('Error setting up the database: ', error);
  } finally {
    process.exit(0); // End the script
  }
})();
