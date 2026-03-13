const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("keuangan.db");

db.all("SELECT * FROM transaksi", [], (err, rows) => {
  if (err) return console.error(err.message);
  console.table(rows);
  db.close();
});