const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
const saltRounds = 10;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: "rahasia123",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 } // 1 jam
}));

// Database
const db = new sqlite3.Database("keuangan.db");

// Tabel user
db.run(`
CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)
`);

// Tabel transaksi
db.run(`
CREATE TABLE IF NOT EXISTS transaksi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tanggal TEXT,
  tipe TEXT,
  kategori TEXT,
  jumlah INTEGER
)
`);

// Middleware cek login
function auth(req, res, next) {
  if (!req.session.userId) return res.status(401).send("Login dulu");
  next();
}

/* ===== REGISTER ===== */
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Data tidak lengkap");

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  db.run("INSERT INTO user (username, password) VALUES (?, ?)", [username, hashedPassword], function(err) {
    if (err) return res.status(500).send("Username sudah digunakan");
    res.json({ message: "Registrasi berhasil" });
  });
});

/* ===== LOGIN ===== */
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Data tidak lengkap");

  db.get("SELECT * FROM user WHERE username = ?", [username], async (err, user) => {
    if (err) return res.status(500).send(err.message);
    if (!user) return res.status(401).send("User tidak ditemukan");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send("Password salah");

    req.session.userId = user.id;
    res.json({ message: "Login berhasil" });
  });
});

/* ===== LOGOUT ===== */
app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logout berhasil" });
});

/* ===== CRUD PEMASUKAN ===== */
app.get("/api/pemasukan", auth, (_, res) => {
  db.all("SELECT * FROM transaksi WHERE tipe='pemasukan' ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.post("/api/pemasukan", auth, (req, res) => {
  const { tanggal, kategori, jumlah } = req.body;
  if (!tanggal || !kategori || !jumlah) return res.status(400).send("Data tidak lengkap");

  db.run(
    "INSERT INTO transaksi (tanggal, tipe, kategori, jumlah) VALUES (?, 'pemasukan', ?, ?)",
    [tanggal, kategori, jumlah],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.json({ id: this.lastID });
    }
  );
});

app.put("/api/pemasukan/:id", auth, (req, res) => {
  const { id } = req.params;
  const { kategori, jumlah } = req.body;
  db.run(
    "UPDATE transaksi SET kategori=?, jumlah=? WHERE id=? AND tipe='pemasukan'",
    [kategori, jumlah, id],
    function(err) {
      if (err) return res.status(500).send(err.message);
      if (this.changes === 0) return res.status(404).send("Data tidak ditemukan");
      res.json({ message: "Pemasukan diperbarui" });
    }
  );
});

app.delete("/api/pemasukan/:id", auth, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM transaksi WHERE id=? AND tipe='pemasukan'", [id], function(err) {
    if (err) return res.status(500).send(err.message);
    if (this.changes === 0) return res.status(404).send("Data tidak ditemukan");
    res.json({ message: "Pemasukan dihapus" });
  });
});

/* ===== CRUD PENGELUARAN ===== */
app.get("/api/pengeluaran", auth, (_, res) => {
  db.all("SELECT * FROM transaksi WHERE tipe='pengeluaran' ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.post("/api/pengeluaran", auth, (req, res) => {
  const { tanggal, kategori, jumlah } = req.body;
  if (!tanggal || !kategori || !jumlah) return res.status(400).send("Data tidak lengkap");

  db.run(
    "INSERT INTO transaksi (tanggal, tipe, kategori, jumlah) VALUES (?, 'pengeluaran', ?, ?)",
    [tanggal, kategori, jumlah],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.json({ id: this.lastID });
    }
  );
});

app.put("/api/pengeluaran/:id", auth, (req, res) => {
  const { id } = req.params;
  const { kategori, jumlah } = req.body;
  db.run(
    "UPDATE transaksi SET kategori=?, jumlah=? WHERE id=? AND tipe='pengeluaran'",
    [kategori, jumlah, id],
    function(err) {
      if (err) return res.status(500).send(err.message);
      if (this.changes === 0) return res.status(404).send("Data tidak ditemukan");
      res.json({ message: "Pengeluaran diperbarui" });
    }
  );
});

app.delete("/api/pengeluaran/:id", auth, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM transaksi WHERE id=? AND tipe='pengeluaran'", [id], function(err) {
    if (err) return res.status(500).send(err.message);
    if (this.changes === 0) return res.status(404).send("Data tidak ditemukan");
    res.json({ message: "Pengeluaran dihapus" });
  });
});

/* ===== REKAP TRANSAKSI ===== */
app.get("/api/transaksi", auth, (_, res) => {
  db.all("SELECT * FROM transaksi ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).send(err.message);

    db.get(
      `SELECT
        COALESCE(SUM(CASE WHEN tipe='pemasukan' THEN jumlah ELSE 0 END),0) AS total_pemasukan,
        COALESCE(SUM(CASE WHEN tipe='pengeluaran' THEN jumlah ELSE 0 END),0) AS total_pengeluaran,
        COALESCE(SUM(CASE WHEN tipe='pemasukan' THEN jumlah ELSE 0 END),0) -
        COALESCE(SUM(CASE WHEN tipe='pengeluaran' THEN jumlah ELSE 0 END),0) AS saldo
      FROM transaksi`,
      [], (err2, summary) => {
        if (err2) return res.status(500).send(err2.message);
        res.json({ rows, summary });
      }
    );
  });
});

/* ===== GRAFIK ===== */
app.get("/api/grafikKategori", auth, (_, res) => {
  db.all(
    "SELECT kategori, SUM(jumlah) as total FROM transaksi WHERE tipe='pengeluaran' GROUP BY kategori",
    [], (err, rows) => {
      if (err) return res.status(500).send(err.message);
      res.json(rows);
    }
  );
});

app.get("/api/grafikPemasukan", auth, (_, res) => {
  db.all(
    "SELECT kategori, SUM(jumlah) as total FROM transaksi WHERE tipe='pemasukan' GROUP BY kategori",
    [], (err, rows) => {
      if (err) return res.status(500).send(err.message);
      res.json(rows);
    }
  );
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));