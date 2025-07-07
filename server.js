// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.fieldname === 'audio' ? 'uploads/audio/' : 'uploads/images/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB límite
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Solo archivos de audio permitidos'));
      }
    } else if (file.fieldname === 'cover') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Solo archivos de imagen permitidos'));
      }
    }
  }
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/musicapi', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Modelos de datos
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isPremium: { type: Boolean, default: false },
  playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  createdAt: { type: Date, default: Date.now }
});

const SongSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String },
  duration: { type: Number }, // en segundos
  genre: { type: String },
  audioUrl: { type: String, required: true },
  coverUrl: { type: String },
  streamUrl: { type: String }, // para streaming
  isOffline: { type: Boolean, default: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  plays: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const PlaylistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  coverUrl: { type: String },
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Song = mongoose.model('Song', SongSchema);
const Playlist = mongoose.model('Playlist', PlaylistSchema);

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// RUTAS DE AUTENTICACIÓN

// Registro de usuario
app.post('/api/auth/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Usuario o email ya existe' });
    }

    // Hashear password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.status(201).json({ token, user: { id: user._id, username, email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RUTAS DE CANCIONES

// Obtener todas las canciones
app.get('/api/songs', async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, artist, search } = req.query;
    const query = {};

    if (genre) query.genre = genre;
    if (artist) query.artist = new RegExp(artist, 'i');
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { artist: new RegExp(search, 'i') },
        { album: new RegExp(search, 'i') }
      ];
    }

    const songs = await Song.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Song.countDocuments(query);

    res.json({
      songs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener canción por ID
app.get('/api/songs/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Canción no encontrada' });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subir nueva canción
app.post('/api/songs', authenticateToken, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, artist, album, genre, duration, streamUrl, isOffline } = req.body;

    if (!req.files.audio && !streamUrl) {
      return res.status(400).json({ error: 'Archivo de audio o URL de streaming requerido' });
    }

    const song = new Song({
      title,
      artist,
      album,
      genre,
      duration: parseInt(duration),
      audioUrl: req.files.audio ? `/uploads/audio/${req.files.audio[0].filename}` : null,
      coverUrl: req.files.cover ? `/uploads/images/${req.files.cover[0].filename}` : null,
      streamUrl,
      isOffline: isOffline === 'true',
      uploadedBy: req.user.userId
    });

    await song.save();
    res.status(201).json(song);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar canción
app.put('/api/songs/:id', authenticateToken, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Canción no encontrada' });
    }

    // Verificar que el usuario sea el propietario
    if (song.uploadedBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const updatedSong = await Song.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedSong);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar canción
app.delete('/api/songs/:id', authenticateToken, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Canción no encontrada' });
    }

    // Verificar que el usuario sea el propietario
    if (song.uploadedBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Eliminar archivos del disco
    if (song.audioUrl) {
      const audioPath = path.join(__dirname, song.audioUrl);
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }

    if (song.coverUrl) {
      const coverPath = path.join(__dirname, song.coverUrl);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: 'Canción eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reproducir canción (incrementar contador)
app.post('/api/songs/:id/play', async (req, res) => {
  try {
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $inc: { plays: 1 } },
      { new: true }
    );

    if (!song) {
      return res.status(404).json({ error: 'Canción no encontrada' });
    }

    res.json({ message: 'Reproducción registrada', plays: song.plays });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RUTAS DE PLAYLISTS

// Obtener playlists del usuario
app.get('/api/playlists', authenticateToken, async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user.userId })
      .populate('songs', 'title artist coverUrl duration')
      .sort({ createdAt: -1 });

    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear playlist
app.post('/api/playlists', authenticateToken, upload.single('cover'), async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    const playlist = new Playlist({
      name,
      description,
      coverUrl: req.file ? `/uploads/images/${req.file.filename}` : null,
      owner: req.user.userId,
      isPublic: isPublic === 'true'
    });

    await playlist.save();
    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar canción a playlist
app.post('/api/playlists/:id/songs', authenticateToken, async (req, res) => {
  try {
    const { songId } = req.body;
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    if (playlist.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (!playlist.songs.includes(songId)) {
      playlist.songs.push(songId);
      await playlist.save();
    }

    const updatedPlaylist = await Playlist.findById(req.params.id)
      .populate('songs', 'title artist coverUrl duration');

    res.json(updatedPlaylist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar canción de playlist
app.delete('/api/playlists/:id/songs/:songId', authenticateToken, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    if (playlist.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    playlist.songs = playlist.songs.filter(
      songId => songId.toString() !== req.params.songId
    );

    await playlist.save();

    const updatedPlaylist = await Playlist.findById(req.params.id)
      .populate('songs', 'title artist coverUrl duration');

    res.json(updatedPlaylist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RUTAS DE FAVORITOS

// Obtener favoritos del usuario
app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('favorites');
    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar a favoritos
app.post('/api/favorites/:songId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user.favorites.includes(req.params.songId)) {
      user.favorites.push(req.params.songId);
      await user.save();
    }

    res.json({ message: 'Agregado a favoritos' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remover de favoritos
app.delete('/api/favorites/:songId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    user.favorites = user.favorites.filter(
      songId => songId.toString() !== req.params.songId
    );
    await user.save();

    res.json({ message: 'Removido de favoritos' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RUTAS DE STREAMING

// Stream de audio
app.get('/api/stream/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song || !song.audioUrl) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const audioPath = path.join(__dirname, song.audioUrl);
    
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(audioPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(audioPath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const totalSongs = await Song.countDocuments();
    const totalPlaylists = await Playlist.countDocuments();
    const totalUsers = await User.countDocuments();
    const topSongs = await Song.find().sort({ plays: -1 }).limit(10);

    res.json({
      totalSongs,
      totalPlaylists,
      totalUsers,
      topSongs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manejo de errores
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Archivo demasiado grande' });
    }
  }
  res.status(500).json({ error: error.message });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;