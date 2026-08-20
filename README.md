# 🎯 Field Hunt 2026 — Advanced Computing Freshers Edition

A high-stakes, interactive treasure hunt web application designed for freshers' induction. This project features real-time progress tracking, digital clue verification, and a "God Mode" developer dashboard.

## 🚀 Key Features

- **Dynamic Clue System:** Manage riddles and locations entirely via CSV or the live developer dashboard.
- **Secure Authentication:** Leader-based login using registered mobile numbers.
- **Developer "God Mode":** 
  - Edit team names and member lists in real-time.
  - Add/Delete teams and venue nodes on the fly.
  - Manually override team progress (Level Selector).
  - Live telemetry of all active units.
- **Production-Grade Security:**
  - SHA-256 Hashing for all unlock codes and the judge access code.
  - Anti-cheat measures (Disabled right-click and DevTools shortcuts in production).
- **Persistent Progress:** Saves all data and progress in browser local storage.

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS (Modern HUD/Cyber aesthetic)
- **Data:** PapaParse (CSV), CryptoJS (Security)
- **Deployment:** Optimized for Vercel

## 📂 Project Structure

- `/public/data/`: Contains `teams.csv` and `venues.csv` for initial setup.
- `/src/store/`: The "Engine" (`HuntStore.tsx`) managing all game logic.
- `/src/components/judge/`: The Command Monitor (Developer Dashboard).
- `/src/components/participant/`: The student-facing experience.

## 🏁 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Access Developer Mode:**
   - Go to "Judge Monitor"
   - Access Code: `0786`

## 🛡 Security Note

Unlock codes in `venues.csv` are stored as SHA-256 hashes. To generate new hashes for your custom codes, use a SHA-256 generator and update the `correctCode` column.

## 🌐 Deployment

This project is ready for **Vercel**. 
1. Push your code to GitHub.
2. Connect the repo to Vercel.
3. Done!

---
*Built for the next generation of computing experts.*
