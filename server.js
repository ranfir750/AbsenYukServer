const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "absensi_api",
});

db.connect((err) => {
  if (err) {
    console.error("Koneksi ke MySQL gagal: ", err);
  } else {
    console.log("Terhubung ke MySQL");
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Secret Key
const secretKey = "mySecretKey123";

// Generate Token
function generateToken(user) {
  const payload = {
    id: user.id_users,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, secretKey, { expiresIn: "24h" });
}

// Middleware untuk verifikasi token
function verifyToken(req, res, next) {
  const bearerHeader = req.headers.authorization;

  if (typeof bearerHeader !== "undefined") {
    const bearerToken = bearerHeader.split(" ")[1];
    req.token = bearerToken;

    jwt.verify(bearerToken, secretKey, (err, decoded) => {
      if (err) {
        res.sendStatus(403);
      } else {
        req.user = decoded;

        // Tambahkan header otorisasi ke respons
        res.setHeader("Authorization", bearerToken);

        next();
      }
    });
  } else {
    res.sendStatus(401);
  }
}

// Endpoint Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      } else {
        if (results.length === 0) {
          res.status(401).json({ message: "Username tidak valid" });
        } else {
          const user = results[0];

          if (password === user.password) {
            const token = generateToken(user);
            const id_users = user.id_users;
            const email = user.email;
            const nama_lengkap = user.nama_lengkap;
            const jenis_kelamin = user.jenis_kelamin;
            const alamat = user.alamat;
            const no_hp = user.no_hp;
            const role = user.role;

            // Simpan token di local storage
            res.json({
              token,
              id_users,
              email,
              nama_lengkap,
              jenis_kelamin,
              alamat,
              no_hp,
              role,
            });
          } else {
            res.status(401).json({ message: "Password tidak valid" });
          }
        }
      }
    }
  );
});

// Endpoint Create User
app.post("/users", (req, res) => {
  const {
    nama_lengkap,
    username,
    password,
    email,
    jenis_kelamin,
    alamat,
    no_hp,
    role,
  } = req.body;

  // Check if any of the required fields are empty
  if (
    !nama_lengkap ||
    !username ||
    !password ||
    !email ||
    !jenis_kelamin ||
    !alamat ||
    !no_hp ||
    !role
  ) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }

  db.query(
    "INSERT INTO users (nama_lengkap, username, password, email, jenis_kelamin, alamat, no_hp, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      nama_lengkap,
      username,
      password,
      email,
      jenis_kelamin,
      alamat,
      no_hp,
      role,
    ],
    (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      } else {
        res.json({ message: "Pengguna berhasil dibuat" });
      }
    }
  );
});

// Endpoint Read All Users
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    } else {
      res.json(results);
    }
  });
});

// Endpoint Read User by ID
app.get("/users/:id_users", (req, res) => {
  const id_users = req.params.id_users;

  db.query(
    "SELECT * FROM users WHERE id_users = ?",
    [id_users],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      } else {
        if (results.length === 0) {
          res.status(404).json({ message: "Pengguna tidak ditemukan" });
        } else {
          res.json(results[0]);
        }
      }
    }
  );
});

// Endpoint Edit Users by ID
app.put("/users/:id_users", (req, res) => {
  const id_users = req.params.id_users;
  const {
    username,
    password,
    email,
    nama_lengkap,
    jenis_kelamin,
    alamat,
    no_hp,
  } = req.body;

  db.query(
    "UPDATE users SET username = ?, password = ?, email = ?, nama_lengkap = ?, jenis_kelamin = ?, alamat = ?, no_hp = ? WHERE id_users = ?",
    [
      username,
      password,
      email,
      nama_lengkap,
      jenis_kelamin,
      alamat,
      no_hp,
      id_users,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      } else {
        if (result.affectedRows === 0) {
          res.status(404).json({ message: "Pengguna tidak ditemukan" });
        } else {
          res.json({ message: "Pengguna berhasil diperbarui" });
        }
      }
    }
  );
});

// Endpoint Delete User by ID
app.delete("/users/:id_users", (req, res) => {
  const id_users = req.params.id_users;

  db.query(
    "DELETE FROM users WHERE id_users = ?",
    [id_users],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      } else {
        res.json({ message: "Pengguna berhasil dihapus" });
      }
    }
  );
});

app.post("/cuti", (req, res) => {
  const { keterangan, tanggal_mulai, tanggal_selesai, alasan_cuti, user_id } =
    req.body;

  db.query(
    "INSERT INTO cuti (keterangan, tanggal_mulai, tanggal_selesai, alasan_cuti, status_cuti, user_id) VALUES (?, ?, ?, ?, ?, ?)",
    [
      keterangan,
      tanggal_mulai,
      tanggal_selesai,
      alasan_cuti,
      "Menunggu",
      user_id,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Terjadi kesalahan server" });
      } else {
        return res.json({ message: "Cuti berhasil dibuat" });
      }
    }
  );
});

// Endpoint Read All Cuti
app.get("/cuti", (req, res) => {
  db.query("SELECT * FROM cuti", (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    } else {
      res.json(results);
    }
  });
});

// Endpoint Read Cuti by Users ID
app.get("/cuti/user/:user_id", (req, res) => {
  const id_user = req.params.user_id;

  const query = `
    SELECT *
    FROM users
    INNER JOIN cuti ON users.id_users = cuti.user_id
    WHERE users.id_users = ?
    ORDER BY cuti.id_cuti DESC
    LIMIT 4
  `;

  db.query(query, [id_user], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    } else {
      if (results.length === 0) {
        res.status(404).json({ message: "Cuti tidak ditemukan" });
      } else {
        res.json(results);
      }
    }
  });
});

// Endpoint Count Total Cuti by ID
app.get("/cuti/count/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  const status_cuti = req.params.status;

  try {
    const query =
      "SELECT COUNT(*) AS total_cuti FROM cuti WHERE user_id = ? AND status_cuti = 'Disetujui'";
    const [result] = await db.promise().query(query, [user_id, status_cuti]);
    const totalCuti = result[0].total_cuti;

    res.json({ totalCuti, status_cuti });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// Endpoint Update Cuti by ID
app.put("/cuti/:id_cuti", (req, res) => {
  const id_cuti = req.params.id_cuti;
  const {
    keterangan,
    tanggal_mulai,
    tanggal_selesai,
    alasan_cuti,
    status_cuti,
  } = req.body;

  db.query(
    "UPDATE cuti SET keterangan = ?, tanggal_mulai = ?, tanggal_selesai = ?, alasan_cuti = ?, status_cuti = ? WHERE id_cuti = ?",
    [
      keterangan,
      tanggal_mulai,
      tanggal_selesai,
      alasan_cuti,
      status_cuti,
      id_cuti,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      } else {
        res.json({ message: "Cuti berhasil diperbarui" });
      }
    }
  );
});

// Endpoint Delete Cuti by ID
app.delete("/cuti/:cuti_id", (req, res) => {
  const cuti_id = req.params.cuti_id;

  db.query("DELETE FROM cuti WHERE id_cuti = ?", [cuti_id], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    } else {
      res.json({ message: "Cuti berhasil dihapus" });
    }
  });
});

// Endpoint Create Absensi
app.post("/absensi", (req, res) => {
  const {
    user_id,
    absensi_masuk,
    absensi_pulang,
    latitude_masuk,
    longitude_masuk,
    latitude_pulang,
    longitude_pulang,
    foto_masuk,
    foto_pulang,
    status_hadir,
  } = req.body;

  db.query(
    "INSERT INTO absensi (user_id, absensi_masuk, absensi_pulang, latitude_masuk, longitude_masuk, latitude_pulang, longitude_pulang, foto_masuk, foto_pulang,status_hadir) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      user_id,
      absensi_masuk,
      absensi_pulang,
      latitude_masuk,
      longitude_masuk,
      latitude_pulang,
      longitude_pulang,
      foto_masuk,
      foto_pulang,
      status_hadir,
    ],
    (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      } else {
        res.json({ message: "Absensi berhasil dibuat" });
      }
    }
  );
});

// Endpoint Read All Absensi
app.get("/absensi", (req, res) => {
  const query = `
    SELECT a.id_absensi, a.user_id, a.absensi_masuk, a.absensi_pulang,
      a.latitude_masuk, a.longitude_masuk, a.latitude_pulang, a.longitude_pulang,
      a.foto_masuk, a.foto_pulang, a.status_hadir,
      u.nama_lengkap, u.role
    FROM absensi AS a
    JOIN users AS u ON a.user_id = u.id_users
    ORDER BY a.absensi_masuk DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Terjadi kesalahan query:", err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    } else {
      const dataAbsensi = results.map((item) => ({
        id_absensi: item.id_absensi,
        user_id: item.user_id,
        absensi_masuk: item.absensi_masuk,
        absensi_pulang: item.absensi_pulang,
        latitude_masuk: item.latitude_masuk,
        longitude_masuk: item.longitude_masuk,
        latitude_pulang: item.latitude_pulang,
        longitude_pulang: item.longitude_pulang,
        foto_masuk: item.foto_masuk,
        foto_pulang: item.foto_pulang,
        status_hadir: item.status_hadir,
        nama_lengkap: item.nama_lengkap,
        role: item.role,
      }));

      res.json(dataAbsensi);
    }
  });
});

// Endpoint Read Absensi by ID
app.get("/absensi/:id_absensi", (req, res) => {
  const id_absensi = req.params.id_absensi;

  db.query(
    "SELECT * FROM absensi WHERE id_absensi = ?",
    [id_absensi],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      } else {
        if (results.length === 0) {
          res.status(404).json({ message: "Absensi tidak ditemukan" });
        } else {
          res.json(results[0]);
        }
      }
    }
  );
});

// Endpoint Update Absensi by ID
app.put("/absensi/:id_absensi", (req, res) => {
  const id_absensi = req.params.id_absensi;
  const {
    absensi_masuk,
    absensi_pulang,
    latitude_masuk,
    longitude_masuk,
    latitude_pulang,
    longitude_pulang,
    foto_masuk,
    foto_pulang,
    user_id,
  } = req.body;

  db.query(
    "UPDATE absensi SET absensi_masuk = ?, absensi_pulang = ?, latitude_masuk = ?, longitude_masuk = ?, latitude_pulang = ?, longitude_pulang = ?, foto_masuk = ?, foto_pulang = ?, status_hadir = ? ,id_users = ? WHERE id_absensi = ?",
    [
      absensi_masuk,
      absensi_pulang,
      latitude_masuk,
      longitude_masuk,
      latitude_pulang,
      longitude_pulang,
      foto_masuk,
      foto_pulang,
      user_id,
      id_absensi,
      status_hadir,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      } else {
        res.json({ message: "Absensi berhasil diperbarui" });
      }
    }
  );
});

// Endpoint Delete Absensi by ID
app.delete("/absensi/:id_absensi", (req, res) => {
  const id_absensi = req.params.id_absensi;

  db.query(
    "DELETE FROM absensi WHERE id_absensi = ?",
    [id_absensi],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      } else {
        res.json({ message: "Absensi berhasil dihapus" });
      }
    }
  );
});

// Endpoint Create SP
app.post("/sp", (req, res) => {
  const {
    user_id,
    tanggal_mulai_sp,
    tanggal_selesai_sp,
    alasan_sp,
    status_sp,
  } = req.body;

  db.query(
    "INSERT INTO sp (user_id, tanggal_mulai_sp, tanggal_selesai_sp, alasan_sp, status_sp) VALUES (?, ?, ?, ?, ?)",
    [user_id, tanggal_mulai_sp, tanggal_selesai_sp, alasan_sp, status_sp],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      } else {
        res.json({ message: "Data SP berhasil ditambahkan" });
      }
    }
  );
});

// Endpoint Read All SP
app.get("/sp", (req, res) => {
  db.query("SELECT * FROM sp", (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    } else {
      res.json(results);
    }
  });
});

// Endpoint Get SP by ID
app.get("/sp/:id_sp", (req, res) => {
  const id_sp = req.params.id_sp;

  db.query("SELECT * FROM sp WHERE id_sp = ?", [id_sp], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    } else {
      if (result.length === 0) {
        res.status(404).json({ message: "Data SP tidak ditemukan" });
      } else {
        res.json(result[0]);
      }
    }
  });
});

// Endpoint Read SP by User ID
app.get("/sp/user/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  db.query("SELECT * FROM sp WHERE user_id = ?", [user_id], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    } else {
      if (results.length === 0) {
        res.status(404).json({ message: "Data SP tidak ditemukan" });
      } else {
        res.json(results);
      }
    }
  });
});

app.get("/sp/total/:user_id", async (req, res) => {
  const user_id = req.params.user_id; // Ambil user_id dari parameter

  try {
    const query = "SELECT COUNT(*) AS total_sp FROM sp WHERE user_id = ?";
    const [result] = await db.promise().query(query, [user_id]);
    const totalSP = result[0].total_sp;

    res.json({ totalSP });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// Endpoint Update SP by ID
app.put("/sp/:id_sp", (req, res) => {
  const id_sp = req.params.id_sp;
  const {
    user_id,
    tanggal_mulai_sp,
    tanggal_selesai_sp,
    alasan_sp,
    status_sp,
  } = req.body;

  db.query(
    "UPDATE sp SET user_id = ?, tanggal_mulai_sp = ?, tanggal_selesai_sp = ?, alasan_sp = ?, status_sp = ? WHERE id_sp = ?",
    [
      user_id,
      tanggal_mulai_sp,
      tanggal_selesai_sp,
      alasan_sp,
      status_sp,
      id_sp,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      } else {
        res.json({ message: "Data SP berhasil diperbarui" });
      }
    }
  );
});

// Endpoint Delete SP by ID
app.delete("/sp/:id_sp", (req, res) => {
  const id_sp = req.params.id_sp;

  db.query("DELETE FROM sp WHERE id_sp = ?", [id_sp], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    } else {
      res.json({ message: "Data SP berhasil dihapus" });
    }
  });
});

app.listen(3000, () => {
  console.log("Server berjalan di port 3000");
});
