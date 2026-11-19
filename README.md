# Book Library

A simple digital library web application built with **Node.js**, **Express**, **MySQL**, and vanilla **HTML/CSS/JavaScript**.

## Features
- Dashboard with statistics
- My Library (grid/list of books)
- Add / edit / delete books (manual or via Google Books API)
- Favorites, reading status, rating
- LocalStorage for theme, view preference, last filter and draft forms
- History of reading‑status changes
- Responsive design (desktop / tablet / mobile)

## Prerequisites
- Node.js (v20 or later)
- MySQL server

## Setup
1. Clone / copy the repository.
2. `cd book-library`
3. `npm install`
4. Create a MySQL database and run `database/schema.sql`.
5. Copy `.env.example` to `.env` and fill in your DB credentials and optional Google Books API key.
6. `npm run dev` to start the dev server (nodemon).
7. Open `http://localhost:3000` in a browser.

## Scripts
- `npm start` – run production server
- `npm run dev` – run server with nodemon (auto‑restart)
