# 🎵 VibeTune – Music Player Web Application

VibeTune is a full-stack music player web application that allows users to listen to songs, browse albums, like/unlike tracks, manage their profile, and access an admin dashboard.  
It is built using **HTML, CSS, JavaScript (Frontend)** and **Node.js, Express, MongoDB Atlas (Backend)** and fully deployed online.

---

## 🌍 Live Demo

🔗 **VibeTune Hosted Website:**  
https://vibetune-music-player.onrender.com

---

## 📌 About the Project

This project demonstrates complete **full-stack development**, including:

- User authentication (Signup/Login using JWT)
- Playing songs with custom audio controls
- Album-based song browsing using dynamic folders
- Liked Songs system (heart button ❤)
- Admin panel for viewing all registered users
- Secured backend API with authentication middleware
- Responsive and clean UI
- File-based song serving (`Songs/AlbumName/...`)

VibeTune is designed to be simple, fast, and ideal for showcasing full-stack development skills.

---

## 🛠️ Tech Stack

### **Frontend**
- HTML5  
- CSS3  
- JavaScript (Vanilla JS)  
- Fetch API  
- LocalStorage  

### **Backend**
- Node.js  
- Express.js  
- MongoDB Atlas  
- Mongoose  
- JWT Authentication  

### **Tools**
- Git LFS (for large `.mp3` + image files)  
- Render (Backend Hosting)  
- MongoDB Atlas Free Cluster  

---

## ✨ Features

### 🔐 Authentication
- User registration and login  
- JWT token-based login persistence  
- Auto-session restoration  
- Protected routes with express middleware  

### 🎧 Music Player
- Play, pause, next, previous  
- Dynamic seek bar  
- Real-time song progress updates  
- Displays current playing song info  

### 📁 Album & Song Management
Song folders automatically loaded from:
Frontend/Songs/AlbumName/

Each album contains:
- `.mp3` files  
- `cover.jpeg`  
- `info.json` (title + description)

### ❤️ Liked Songs
- Like/unlike any song  
- “Favorite Songs” tab  
- Stored securely in MongoDB  

### 🛡️ Admin Panel
- Accessible only to admin users  
- Admin can view all registered users  

---

## 📂 Folder Structure

VibeTune/
├── Backend/
│ ├── server.js
│ ├── makeAdmin.js
│ ├── checkAdmin.js
│ ├── models/
│ │ └── User.js
│ ├── .env
│ └── package.json
│
├── Frontend/
│ ├── index.html
| ├── admin.html
│ ├── app.js
│ ├── config.js
│ ├── css/
│ ├── img/
│ └── Songs/
│ ├── Album1/
│ ├── Album2/
│ └── ...
│
└── README.md


---

## 🔧 Environment Variables

Create `.env` inside **Backend/**:

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=3000


---

## 🚀 Running Project Locally

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Sourav2629/VibeTune-Music-Player.git
cd VibeTune-Music-Player/Backend

Install Backend Dependencies
npm install

Start Backend Server
npm start

Making an Admin User

Run this script:
node makeAdmin.js user-email@example.com

This updates isAdmin = true for that user.

API Endpoints
Auth
POST /api/auth/register
POST /api/auth/login

User
GET /api/user/profile
PATCH /api/user/profile

Songs
GET /api/songs/liked
POST /api/songs/like
DELETE /api/songs/unlike

Admin
GET /api/admin/users

## 📸 Screenshots

### 🏠 Home Page
![Home Page](https://github.com/user-attachments/assets/4f3817a9-d5a3-4777-bbb5-8ed8b2fde546)

### 🔐 Login Page
![Login Page](https://github.com/user-attachments/assets/8eb4be98-9565-497a-8c55-9333d0a81feb)

### 🎵 After Login (Dashboard)
![Dashboard](https://github.com/user-attachments/assets/a948cdf3-3b3a-45e3-8a58-b92da72dd818)

🌟 Why This Project Matters
Demonstrates real authentication logic
Shows backend API design
Presentable UI for portfolio
File-system based media architecture
Fully deployed online
Uses Git LFS, MongoDB Atlas, Render deployments

⭐ Show Your Support
If you found this project useful or interesting, please star⭐ the repository!
