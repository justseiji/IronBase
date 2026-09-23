# IronBase

## 1. Overview
IronBase is a mobile-first progressive overload tracker designed for weightlifting and strength training. It solves the problem of cluttered, overly complex fitness apps by providing a clean, Apple-like interface to log workouts, track personal records (PRs), and visualize estimated 1-rep max (e1RM) progress over time.

## 2. Setup and installation
To get the project running locally from scratch:

1. **Prerequisites:** Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) installed.
2. **Clone the repository:**
   ```bash
   git clone https://github.com/justseiji/IronBase.git
   cd IronBase
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Environment and configuration:**
   The current version of IronBase runs entirely client-side. There are no environment variables (`.env` files) required to run the local development build.
5. **Database setup:**
   No external database setup is required. The app utilizes the browser's `localStorage` for data persistence. Default exercises and mock history are seeded automatically on first load.

## 3. How to run it
Start the local Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. You should see the IronBase Dashboard, featuring a workout heatmap, training insights, and recent activity.

## 4. Features and usage
- **Dashboard:** Provides a high-level overview of your fitness journey, including an activity heatmap and top-level training insights (e.g., total volume, recent PRs).
- **Workout Log:** Allows you to log sets (weight, reps, RPE) for specific exercises. It automatically detects new PRs and compares current sets with your previous session.
- **Exercise History:** A detailed view for any given exercise, showing historical performance, past sets, and interactive charts plotting your e1RM and volume progress over time.

## 5. Project structure
- `src/components/`: Reusable UI elements structured atomically (`atoms`, `molecules`, `organisms`).
- `src/pages/`: The main routing views (`DashboardPage`, `WorkoutLogPage`, `ExerciseHistoryPage`, etc.).
- `src/layout/`: Global layout wrappers (e.g., `AppShell`, `MobileBottomNav`).
- `src/utils/`: Helper functions for numerical precision formatting and `localStorage` interactions.
- `src/data/`: The default exercise library (`defaultExercises.js`).

## 6. Screenshots
> **Note:** Replace these placeholder links with actual images of the app once hosted or committed.

![Dashboard Overview](docs/screenshots/dashboard.png)
![Workout Logging](docs/screenshots/workout_log.png)

## 7. Known issues and next steps
**Known issues:**
- All data is currently stored in `localStorage`. If the browser cache is cleared, data is lost. It does not sync across different devices.
- Some complex charts may experience minor layout clipping on extremely narrow screens (under 320px width).

**Next steps:**
- Integrate a Backend-as-a-Service (BaaS) like Supabase to enable cloud data syncing and persistent storage.
- Implement user authentication (Sign up / Login).
- Build a feature to let users create, save, and share custom workout templates.

## Credits & AI Usage
This project utilized AI assistance for development. Please see [AI-USAGE.md](./AI-USAGE.md) for full details on how AI tools were employed.
