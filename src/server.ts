import express, { Request, Response, NextFunction } from 'express';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import session from 'express-session';

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    user?: { id: number; username: string };
  }
}

const app = express();
const port = 3000;

// SQLite databases
const filesDb = new sqlite3.Database('files.db', (err: Error | null) => {
  if (err) console.error(err.message);
  console.log('Connected to files database.');
});

const usersDb = new sqlite3.Database('users.db', (err: Error | null) => {
  if (err) console.error(err.message);
  console.log('Connected to users database.');
});

// Create files table
filesDb.run(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    expires TEXT,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create users table
usersDb.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )
`);

//Chnage the Password and username
usersDb.get('SELECT username FROM users WHERE username = ?', ['admin'], (err, row) => {
  if (!row) {
    bcrypt.hash('admin123', 10, (err, hash) => {
      if (err) console.error(err.message);
      usersDb.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hash]);
    });
  }
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 1209600000 } // 2 weeks;
}));

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Protect static files and handle redirects
const protectStaticFiles = (req: Request, res: Response, next: NextFunction) => {
  const protectedPaths = ['/home', '/index.html'];
  const loginPaths = ['/login', '/login.html'];
  
  if (req.session.user && loginPaths.includes(req.path)) {
    return res.redirect('/home');
  }
  if (protectedPaths.includes(req.path) && !req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Apply middleware
app.use(protectStaticFiles);
app.use('/uploads', express.static('uploads'));
app.use(express.static('public', { index: false }));

// Define FileRecord interface
interface FileRecord {
  id: number;
  filename: string;
  filepath: string;
  expires: string | 'Never';
  upload_date: string;
}

// Routes
app.get('/', (req: Request, res: Response) => {
  if (req.session.user) {
    res.redirect('/home');
  } else {
    res.redirect('/login');
  }
});

app.get('/home', isAuthenticated, (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req: Request, res: Response) => {
  if (req.session.user) {
    res.redirect('/home');
  } else {
    res.sendFile(path.join(__dirname, '../public/login.html'));
  }
});

app.get('/api/files', isAuthenticated, (req: Request, res: Response<FileRecord[] | { error: string }>) => {
  filesDb.all('SELECT id, filename, filepath, expires, upload_date FROM files ORDER BY upload_date DESC', [], (err: Error | null, rows: FileRecord[]) => {
    if (err) {
      console.error('Error fetching files:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  usersDb.get('SELECT * FROM users WHERE username = ?', [username], (err: Error | null, user: any) => {
    if (err || !user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    bcrypt.compare(password, user.password, (err, match) => {
      if (match) {
        req.session.user = { id: user.id, username: user.username };
        res.json({ message: 'Login successful' });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
  });
});

app.post('/api/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err.message);
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.clearCookie('connect.sid'); // Clear the default session cookie
    res.json({ message: 'Logged out' });
  });
});

app.post('/api/upload', isAuthenticated, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    console.error('No file uploaded');
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const { filename, path: filepath, originalname, size } = req.file;
  const { expires } = req.body;

  filesDb.run('INSERT INTO files (filename, filepath, expires) VALUES (?, ?, ?)', [originalname, filepath, expires], function(err: Error | null) {
    if (err) {
      console.error('Error saving file to database:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`File uploaded: ${filename}, Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
    res.json({ message: 'File uploaded successfully', filename: originalname, id: this.lastID });
  });
});

app.delete('/api/files/:id', isAuthenticated, (req: Request, res: Response) => {
  filesDb.get('SELECT filepath FROM files WHERE id = ?', [req.params.id], (err: Error | null, row: { filepath: string } | undefined) => {
    if (err || !row) {
      console.error('Error finding file for deletion:', err?.message || 'File not found');
      res.status(404).json({ error: 'File not found' });
      return;
    }

    fs.unlink(row.filepath, (err: NodeJS.ErrnoException | null) => {
      if (err) {
        console.error('Error deleting file from disk:', err.message);
        res.status(500).json({ error: 'Failed to delete file' });
        return;
      }

      filesDb.run('DELETE FROM files WHERE id = ?', [req.params.id], (err: Error | null) => {
        if (err) {
          console.error('Error deleting file from database:', err.message);
          res.status(500).json({ error: 'Failed to delete file record' });
          return;
        }
        console.log(`File deleted: ID ${req.params.id}`);
        res.json({ message: 'File deleted successfully' });
      });
    });
  });
});

// Periodic cleanup of expired files
setInterval(() => {
  filesDb.all('SELECT id, filepath, expires FROM files', [], (err: Error | null, rows: FileRecord[]) => {
    if (err) {
      console.error('Error checking expired files:', err.message);
      return;
    }

    const now = Date.now();
    rows.forEach(row => {
      if (row.expires && row.expires !== 'Never') {
        const expireTime = new Date(row.expires).getTime();
        if (now > expireTime) {
          fs.unlink(row.filepath, (err: NodeJS.ErrnoException | null) => {
            if (!err) {
              filesDb.run('DELETE FROM files WHERE id = ?', [row.id]);
              console.log(`Expired file deleted: ID ${row.id}`);
            }
          });
        }
      }
    });
  });
}, 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});