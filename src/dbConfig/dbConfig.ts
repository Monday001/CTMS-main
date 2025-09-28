import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',   
  user: 'root',        
  password: '',        
  database: 'ctms_db', 
});

export default pool;
