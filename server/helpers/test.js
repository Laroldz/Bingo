import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'database-1.cfm4u4w8acn9.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'kenwong94',
  database: 'bingo',
  port: 3306 // default MySQL port
});

try {
  await connection.connect();
  console.log('Connected to the database');

  const owner_id = '21cbe550-80d1-7028-6cdc-3bc91becfb4f';
  const owner_username = 'larold';
  const title = 'My First Bingo Sheet';
  const description = 'This is a test sheet';
  const share_token = '123456';

  // View the query in the database
  const [rows] = await connection.query('SELECT * FROM BingoSheets');
  console.log('Rows:', rows);
} catch (err) {
  console.error('Error connecting:', err.stack);
} finally {
  await connection.end();
}