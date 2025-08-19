const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

// Configuración de Multer para guardar las imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Directorio donde se guardarán las fotos
  },
  filename: function (req, file, cb) {
    // Renombrar el archivo para evitar colisiones: campo-fecha-nombreoriginal
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Ruta principal: muestra el formulario y la lista de usuarios
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, email, foto_url FROM usuarios ORDER BY fecha_registro DESC');
    res.render('index', { usuarios: result.rows, query: req.query });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los usuarios');
  }
});

// Ruta para mostrar el formulario de registro
router.get('/registrar', (req, res) => {
  res.render('registrar', { query: req.query });
});

// Ruta para procesar el registro de un nuevo usuario
router.post('/registrar', upload.single('foto'), async (req, res) => {
  const { nombre, email, password } = req.body;
  const foto_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insertar en la base de datos
    const query = 'INSERT INTO usuarios (nombre, email, password, foto_url) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [nombre, email, hashedPassword, foto_url];
    await pool.query(query, values);

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al registrar el usuario');
  }
});

module.exports = router;
