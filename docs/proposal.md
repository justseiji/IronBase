# 1. App Proposal

Fill this in for your own idea. Write in full sentences
where it asks - a proposal only you can decode next month does not help
future-you either.

---

## App name

IronBase

## What the app is for, in one sentence

IronBase is a streamlined progressive overload tracker that lets powerlifters record the weight, reps, and sets of their key compound lifts so they can clearly track their gym progress.

## Who is it for

- IronBase is specifically for consistent weightlifters and powerlifters who want a simple way to record their gym progress without the unnecessary features found in larger commercial fitness apps.
- When they open the app, they are trying to record the exact weight and reps they completed for specific exercises during their workout so they can track whether they are progressively lifting heavier over time.

## Sections or routes this app needs

List every top-level screen. A single-page app (like the portfolio) has
**sections** on one route; a multi-screen app uses **routes**
([React Router](../m2-react/README.md)). Aim for **3 to 5** either way. For each,
one sentence on what it is for. If you go over 5, cut one.

| # | Section / route | What it is for |
| - | --- | --- |
| 1 | Dashboard | Shows the user's recent workouts and gives them a quick overview of their lifting progress. |
| 2 | Workout Log | Lets the user record exercises, weight, reps, sets, and RPE during a workout. |
| 3 | Exercise History | Lets the user view previous performances for each exercise and compare them over time. |
| 4 | Workout History | Shows previously completed workout sessions so the user can review what they have trained. |

> Test each one: if you removed it, could the user still do the main thing
> above? If yes, it may not be core - park it for later.

## State: what data does the app hold?

React apps are mostly about **state**. For your **most important screen**, name
the pieces of data it manages and where they live. (A deck is an array of
`{ id, question, answer }` objects; a filter is a string; a "selected card" is an
index.) You do not need final shapes yet - just name them.

| Data | Shape (rough) | Who owns it (which component) | Changes when... |
| --- | --- | --- | --- |
| Current workout | `{ id, date, sessionFocus }` | `WorkoutLog` | The user starts or changes a workout. |
| Exercises | `[{ id, name, muscleGroup }]` | `App` | The user selects or adds an exercise. |
| Logged sets | `[{ exerciseId, weight, reps, RPE }]` | `WorkoutLog` | The user adds or edits a set. |
| Selected exercise | `exerciseId` | `WorkoutLog` | The user selects a different exercise. |
| Workout history | `[{ id, date, sessionFocus, sets }]` | `App` | The user saves or deletes a workout. |

> This is your first pass at [state ownership](../react-theory/06-state-management.md):
> state lives in the lowest component that needs it, and is passed down as props.

## What each screen contains

For your **most important screen**, list the blocks of content it needs (a
heading, an input row, a list of cards, a footer...). These become the
**components** you break it into on the next worksheet.

- Screen: Workout Log
  - Block 1: Workout header showing the date and session focus.
  - Block 2: Exercise selector for choosing the compound lift being performed.
  - Block 3: Set input row for entering weight, reps, and RPE.
  - Block 4: List of logged sets for the current exercise.
  - Block 5: Save workout button to store the completed session.

## Content you need to gather

What real text, data, and images do you need before you can build? (Sample deck
data, project descriptions, photos, a logo, an API if you use one.) List them now
so you are not stuck hunting for them mid-build.

- A list of the key compound exercises to include, such as the user's regular powerlifting movements.
- Sample workout data containing dates, exercises, weights, reps, sets, and RPE values.
- Exercise information such as exercise names and their corresponding muscle groups.
- A simple IronBase logo or fitness-related icons, if needed.

## One risk

What is the one part of this app you are least sure how to build? (A specific
piece of state, a layout, a library you have not used.) Naming it now means
you can ask for help on it early, instead of the night before it is due.

The part I am least sure how to build is managing the workout and logged-set state correctly. The app needs to let the user add multiple sets to different exercises, edit them, and save the complete workout without losing previously entered data. Getting the state ownership and data flow right in React will be important because the workout log is the core feature of IronBase.
