# 📁 FileShare – Secure File Sharing Web App

A TypeScript-based file-sharing platform built with Node.js, Express, and SQLite. Users can upload files that automatically expire after a certain time. The app also supports login-based access and secure storage.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Work_in_Progress_(http://localhost:3000)-red)](http://localhost:3000)
---

## 🚀 Features

- Simple file upload and download
- Expiry system for shared files
- Login system with session support
- SQLite-based storage

---

## 🌐 Live Demo

🔗 **Server**:
- Default credentials: `admin`/`admin123` (change in production).

---

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: SQLite3
- **File Handling**: Multer
- **Authentication**: express-session, bcrypt
- **Build Tool**: TypeScript (tsc)

---

## 📦 Project Structure

```
FileShare/
├── src/
│   └── server.ts          # Express server with TypeScript
├── public/
│   ├── index.html         # Main homepage
│   ├── login.html         # Login page
│   ├── styles.css         # Global styles
│   └── script.js          # Frontend logic (uploads, deletions, progress bar)
├── uploads/               # Directory for uploaded files (git-ignored)
├── files.db               # SQLite database for file metadata (git-ignored)
├── users.db               # SQLite database for users (git-ignored)
├── package.json           
├── tsconfig.json          
└── .gitignore            
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm
- Git

### Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/David-Jhon/FileShare.git
   cd FileShare
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
   **or**:
   ```bash
   npm install bcrypt express express-session multer sqlite3
   ```
   **Install Dev Dependencies**:
   ```bash
   npm install --save-dev @types/bcrypt @types/express @types/express-session @types/multer @types/node nodemon typescript
   ```

3. **Build the TypeScript Project**:
   ```bash
   npm run build
   ```

4. **Start the Server**:
   ```bash
   npm start
   ```
   - Runs the app at `http://localhost:3000`.

   **Or for development (auto-reloads):**:
   ```bash
   npm run dev
   ```
   
7. **Access the App**:
   - Open `http://localhost:3000` in your browser.
   - Log in with `admin`/`admin123` (default credentials).

---

## 🌍 Hosting Guide (Coming Soon)

**Loading...**

#### Backend API (Server) (Coming Soon)

---

## 🧪 API Reference (Coming Soon)

---

## 🔒 License

This project is open-source under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**David Jhon**  
GitHub: [@David-Jhon](https://github.com/David-Jhon)
