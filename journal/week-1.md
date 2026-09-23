# Reflection Journal

## Week of: September 23, 2026

## My goal this week
To initialize the IronBase project, establish the core mobile-first UI for a progressive overload tracker, and set up the foundational features for tracking workouts, estimating 1-rep maxes (e1RM), and detecting personal records (PRs).

## What I did
- Initialized the React + Vite project and structured the `src` directory using atomic design principles (`components`, `pages`, `layout`).
- Developed the primary user flows: the Dashboard, the Workout Log, and the Exercise History views.
- Built a local state management system using `localStorage` to seed default exercises and store mock workout history.
- Implemented data visualization using `recharts` to build a workout heatmap and interactive progress charts for the dashboard and history pages.
- Applied an Apple-like UI polish, refined spacing and typography, fixed mobile header responsiveness, and added a reduced motion accessibility setting.
- Completed the Week 1 documentation updates, including the README, Security Checklist, AI Usage file, and Project Increment Report.

## What blocked me
- Ensuring consistent responsive layouts on extremely small mobile viewports, specifically dealing with the header and complex charts overlapping on screens under 320px.
- Floating-point precision artifacts in JavaScript caused weights to render inconsistently with trailing decimals (e.g., `10.0000001` instead of `10`). This required creating a centralized numerical formatting utility and hunting down remaining uncleaned instances across different components.

## What I learned
- I gained practical experience structuring a React application specifically optimized for mobile-first interactions using standard CSS Modules.
- I learned firsthand why JavaScript's floating-point math requires careful handling in apps that display precision data, reinforcing the importance of centralized formatting functions.
- I learned how to integrate and style the `recharts` library for data visualization, and how to properly handle UI empty states when an exercise has no historical data logged yet.
