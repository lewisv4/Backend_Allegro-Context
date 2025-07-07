# Backend_Allegro-Context
# API RESTful para Música - Documentación Completa

## Descripción General

Esta API RESTful permite gestionar una aplicación de música con soporte tanto para archivos offline como streaming. Incluye autenticación, gestión de usuarios, canciones, playlists, favoritos y streaming de audio.

## Características Principales

- 🎵 **Gestión de Canciones**: Subir, descargar, actualizar y eliminar canciones
- 📱 **Soporte Offline**: Almacenamiento local de archivos de audio
- 🌐 **Streaming**: Reproducción en tiempo real con soporte para HTTP range requests
- 👤 **Autenticación**: Sistema completo con JWT tokens
- 🎶 **Playlists**: Crear y gestionar listas de reproducción
- ❤️ **Favoritos**: Sistema de canciones favoritas
- 🔍 **Búsqueda**: Búsqueda por título, artista, álbum y género
- 📊 **Estadísticas**: Conteo de reproducciones y métricas

## Instalación y Configuración

### Requisitos Previos

- Node.js 16+
- MongoDB 4.4+
- NPM o Yarn

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd music-api

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar MongoDB
mongod

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

### Estructura de Directorios

```
music-api/
├── server.js              # Servidor principal
├── package.json           # Dependencias
├── .env                   # Variables de entorno
├── uploads/               # Archivos subidos
│   ├── audio/            # Archivos de audio
│   └── images/           # Imágenes de portada
├── scripts/              # Scripts de utilidad
│   └── seed.js           # Datos de prueba
└── tests/                # Pruebas unitarias
```

## Endpoints de la API

### Base URL
```
http://localhost:3000/api
```

### Autenticación

#### Registrar Usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "usuario123",
  "email": "usuario@email.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "token": "jwt_token_aqui",
  "user": {
    "id": "user_id",
    "username": "usuario123",
    "email": "usuario@email.com"
  }
}
```

#### Iniciar Sesión
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "password123"
}
```

### Gestión de Canciones

#### Obtener Todas las Canciones
```http
GET /api/songs?page=1&limit=20&genre=rock&search=titulo
```

**Parámetros de consulta:**
- `page`: Número de página (default: 1)
- `limit`: Canciones por página (default: 20)
- `genre`: Filtrar por género
- `artist`: Filtrar por artista
- `search`: Buscar en título, artista o álbum

**Respuesta:**
```json
{
  "songs": [
    {
      "_id": "song_id",
      "title": "Título de la Canción",
      "artist": "Artista",
      "album": "Álbum",
      "duration": 180,
      "genre": "Rock",
      "audioUrl": "/uploads/audio/file.mp3",
      "coverUrl": "/uploads/images/cover.jpg",
      "plays": 1250,
      "createdAt": "2023-01-01T00:00:00Z"
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "total": 100
}
```

#### Obtener Canción por ID
```http
GET /api/songs/:id
```

#### Subir Nueva Canción
```http
POST /api/songs
Authorization: Bearer <token>
Content-Type: multipart/form-data

audio: [archivo_audio.mp3]
cover: [imagen_portada.jpg]
title: "Título de la Canción"
artist: "Artista"
album: "Álbum"
genre: "Rock"
duration: 180
isOffline: true
```

#### Actualizar Canción
```http
PUT /api/songs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Nuevo Título",
  "artist": "Nuevo Artista"
}
```

#### Eliminar Canción
```http
DELETE /api/songs/:id
Authorization: Bearer <token>
```

#### Reproducir Canción (Incrementar Contador)
```http
POST /api/songs/:id/play
```

### Streaming de Audio

#### Stream de Audio
```http
GET /api/stream/:id
Range: bytes=0-1023
```

Este endpoint soporta HTTP Range Requests para streaming eficiente.

### Gestión de Playlists

#### Obtener Playlists del Usuario
```http
GET /api/playlists
Authorization: Bearer <token>
```

#### Crear Playlist
```http
POST /api/playlists
Authorization: Bearer <token>
Content-Type: multipart/form-data

cover: [imagen_portada.jpg]
name: "Mi Playlist"
description: "Descripción de la playlist"
isPublic: true
```

#### Agregar Canción a Playlist
```http
POST /api/playlists/:id/songs
Authorization: Bearer <token>
Content-Type: application/json

{
  "songId": "song_id"
}
```

#### Remover Canción de Playlist
```http
DELETE /api/playlists/:id/songs/:songId
Authorization: Bearer <token>
```

### Gestión de Favoritos

#### Obtener Favoritos
```http
GET /api/favorites
Authorization: Bearer <token>
```

#### Agregar a Favoritos
```http
POST /api/favorites/:songId
Authorization: Bearer <token>
```

#### Remover de Favoritos
```http
DELETE /api/favorites/:songId
Authorization: Bearer <token>
```
# API RESTful para Música - Documentación Completa

## Descripción General

Esta API RESTful permite gestionar una aplicación de música con soporte tanto para archivos offline como streaming. Incluye autenticación, gestión de usuarios, canciones, playlists, favoritos y streaming de audio.

## Características Principales

- 🎵 **Gestión de Canciones**: Subir, descargar, actualizar y eliminar canciones
- 📱 **Soporte Offline**: Almacenamiento local de archivos de audio
- 🌐 **Streaming**: Reproducción en tiempo real con soporte para HTTP range requests
- 👤 **Autenticación**: Sistema completo con JWT tokens
- 🎶 **Playlists**: Crear y gestionar listas de reproducción
- ❤️ **Favoritos**: Sistema de canciones favoritas
- 🔍 **Búsqueda**: Búsqueda por título, artista, álbum y género
- 📊 **Estadísticas**: Conteo de reproducciones y métricas

## Instalación y Configuración

### Requisitos Previos

- Node.js 16+
- MongoDB 4.4+
- NPM o Yarn

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd music-api

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar MongoDB
mongod

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

### Estructura de Directorios

```
music-api/
├── server.js              # Servidor principal
├── package.json           # Dependencias
├── .env                   # Variables de entorno
├── uploads/               # Archivos subidos
│   ├── audio/            # Archivos de audio
│   └── images/           # Imágenes de portada
├── scripts/              # Scripts de utilidad
│   └── seed.js           # Datos de prueba
└── tests/                # Pruebas unitarias
```

## Endpoints de la API

### Base URL
```
http://localhost:3000/api
```

### Autenticación

#### Registrar Usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "usuario123",
  "email": "usuario@email.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "token": "jwt_token_aqui",
  "user": {
    "id": "user_id",
    "username": "usuario123",
    "email": "usuario@email.com"
  }
}
```

#### Iniciar Sesión
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "password123"
}
```

### Gestión de Canciones

#### Obtener Todas las Canciones
```http
GET /api/songs?page=1&limit=20&genre=rock&search=titulo
```

**Parámetros de consulta:**
- `page`: Número de página (default: 1)
- `limit`: Canciones por página (default: 20)
- `genre`: Filtrar por género
- `artist`: Filtrar por artista
- `search`: Buscar en título, artista o álbum

**Respuesta:**
```json
{
  "songs": [
    {
      "_id": "song_id",
      "title": "Título de la Canción",
      "artist": "Artista",
      "album": "Álbum",
      "duration": 180,
      "genre": "Rock",
      "audioUrl": "/uploads/audio/file.mp3",
      "coverUrl": "/uploads/images/cover.jpg",
      "plays": 1250,
      "createdAt": "2023-01-01T00:00:00Z"
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "total": 100
}
```

#### Obtener Canción por ID
```http
GET /api/songs/:id
```

#### Subir Nueva Canción
```http
POST /api/songs
Authorization: Bearer <token>
Content-Type: multipart/form-data

audio: [archivo_audio.mp3]
cover: [imagen_portada.jpg]
title: "Título de la Canción"
artist: "Artista"
album: "Álbum"
genre: "Rock"
duration: 180
isOffline: true
```

#### Actualizar Canción
```http
PUT /api/songs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Nuevo Título",
  "artist": "Nuevo Artista"
}
```

#### Eliminar Canción
```http
DELETE /api/songs/:id
Authorization: Bearer <token>
```

#### Reproducir Canción (Incrementar Contador)
```http
POST /api/songs/:id/play
```

### Streaming de Audio

#### Stream de Audio
```http
GET /api/stream/:id
Range: bytes=0-1023
```

Este endpoint soporta HTTP Range Requests para streaming eficiente.

### Gestión de Playlists

#### Obtener Playlists del Usuario
```http
GET /api/playlists
Authorization: Bearer <token>
```

#### Crear Playlist
```http
POST /api/playlists
Authorization: Bearer <token>
Content-Type: multipart/form-data

cover: [imagen_portada.jpg]
name: "Mi Playlist"
description: "Descripción de la playlist"
isPublic: true
```

#### Agregar Canción a Playlist
```http
POST /api/playlists/:id/songs
Authorization: Bearer <token>
Content-Type: application/json

{
  "songId": "song_id"
}
```

#### Remover Canción de Playlist
```http
DELETE /api/playlists/:id/songs/:songId
Authorization: Bearer <token>
```

### Gestión de Favoritos

#### Obtener Favoritos
```http
GET /api/favorites
Authorization: Bearer <token>
```

#### Agregar a Favoritos
```http
POST /api/favorites/:songId
Authorization: Bearer <token>
```

#### Remover de Favoritos
```http
DELETE /api/favorites/:songId
Authorization: Bearer <token>
```

### Estadísticas

#### Obtener Estadísticas Generales
```http
GET /api/stats
Authorization: Bearer <token>
```

**Respuesta:**
```json
### Estadísticas

#### Obtener Estadísticas Generales
```http
GET /api/stats
Authorization: Bearer <token>
```

**Respuesta:**
```json