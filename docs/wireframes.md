# 2. Wireframes & Component Breakdown

IronBase is a mobile-first React web app intended for use on an iPhone, with a responsive desktop layout. These are box-and-label plans only: they describe content, hierarchy, and responsive behavior rather than visual styling.

---

## Step A: Screen map (10 min)

**First screen:** Dashboard. It is the home base because it gives the lifter a quick progress overview and a clear way to begin logging a workout.

```text
                                      shared navigation
             +---------------------------------------------------------+
             | Dashboard | Workout Log | Exercise History | History    |
             +---------------------------------------------------------+

[Dashboard] -- "Log workout" --> [Workout Log] -- "Save workout" --> [Dashboard]
     |
     | "View workout history"
     v
[Workout History]

[Dashboard] -- "Exercise History" in shared navigation --> [Exercise History]
[Workout Log] -- "Exercise History" in shared navigation --> [Exercise History]
[Exercise History] -- "Workout History" in shared navigation --> [Workout History]
[Workout History] -- "Dashboard" in shared navigation --> [Dashboard]

[Workout Log] -- "choose exercise / add or edit a set" --> [Workout Log]
[Exercise History] -- "choose another exercise" --> [Exercise History]
[Workout History] -- "open a workout row" --> [Workout History: expanded row]
```

The last three arrows are interactions that update content within the current screen, not additional routes. A saved workout returns the user to the Dashboard; the shared navigation and normal browser back behavior give every route a way out.

### Shared navigation and layout behavior

- **Desktop:** A shared header contains the IronBase name and four horizontal navigation links: Dashboard, Workout Log, Exercise History, and Workout History.
- **Phone:** The same four destinations move to a persistent bottom navigation bar with short labels and icons. A compact shared header keeps the IronBase name and the current screen title visible above the content.
- **Footer:** Desktop uses a small shared footer below the main content. On phone, the bottom-navigation safe-area space serves this role so actions and list rows do not sit behind the navigation bar.
- **Route rule:** The navigation changes layout at a responsive breakpoint, but it never changes the four destinations or creates a separate menu screen.

## Step B: One box-sketch per screen (20 min)

| Screen | Desktop layout | Phone layout (what stacks) | Navigates to |
| ------ | -------------- | -------------------------- | ------------ |
| **Dashboard** | Shared horizontal header; page heading and **Log workout** action; two main columns for a progress overview and recent-workout rows; shared footer. | Compact header; heading and action; progress overview above recent-workout cards in one vertical column; persistent bottom navigation. | **Log workout** opens Workout Log. **View workout history** opens Workout History. Shared navigation opens any of the other three routes. |
| **Workout Log** | Shared horizontal header; workout header (date and session focus); exercise selector; a wide set-entry row; logged-set list/table beside or below it; **Save workout** action; shared footer. | Compact header; workout header, exercise selector, set-entry fields, logged sets, and save action stack vertically. Weight, reps, and RPE inputs remain grouped as one set-entry block; the save action is full width above the bottom navigation. | Shared navigation opens the other routes. Choosing an exercise, adding/editing a set, and changing the workout details stay on Workout Log. **Save workout** returns to Dashboard. |
| **Exercise History** | Shared horizontal header; selected-exercise control and performance comparison area side by side or in a two-column main area; chronological previous-performance list below; shared footer. | Compact header; selected-exercise control first, then comparison area, then previous-performance rows in one vertical stack; persistent bottom navigation. | Shared navigation opens Dashboard, Workout Log, or Workout History. Selecting another exercise refreshes this screen rather than opening a new route. |
| **Workout History** | Shared horizontal header; completed-workout rows in a readable list/table showing date and session focus; a row can expand in place to show its logged sets; shared footer. | Compact header; completed workouts become stacked cards. Tapping a card expands its set details within the card; persistent bottom navigation. | Shared navigation opens the other routes. Tapping a workout row expands/collapses its details on this screen; deleting a saved workout, if offered, also stays on this screen. |

### Dashboard box sketches

**Desktop**

```text
+--------------------------------------------------------------------------------+
| IronBase | Dashboard | Workout Log | Exercise History | Workout History       |
+--------------------------------------------------------------------------------+
| Dashboard                                             [ Log workout ]          |
|                                                                                |
| +----------------------------+  +--------------------------------------------+ |
| | Progress overview          |  | Recent workout rows                         | |
| | (quick lifting progress)   |  |                                            | |
| +----------------------------+  | [ View workout history ]                   | |
|                                 +--------------------------------------------+ |
+--------------------------------------------------------------------------------+
| Shared footer                                                                  |
+--------------------------------------------------------------------------------+
```

**Phone**

```text
+----------------------------+
| IronBase     Dashboard     |
+----------------------------+
| Dashboard                  |
| [ Log workout ]            |
|                            |
| [ Progress overview ]      |
|                            |
| [ Recent workout card ]    |
| [ Recent workout card ]    |
| [ View workout history ]   |
+----------------------------+
| Dashboard | Log | Exercises|
| History                    |
+----------------------------+
```

### Workout Log box sketches

**Desktop**

```text
+--------------------------------------------------------------------------------+
| IronBase | Dashboard | Workout Log | Exercise History | Workout History       |
+--------------------------------------------------------------------------------+
| Workout Log                                                                    |
| +------------------- Workout header -----------------------------------------+ |
| | Date                               | Session focus                         | |
| +------------------------------------------------------------------------- --+ |
| [ Exercise selector ]                                                          |
|                                                                                |
| +------------------------------+  +-----------------------------------------+ |
| | Set entry                     |  | Logged sets for selected exercise       | |
| | Weight | Reps | RPE | Add set |  | [ set row ]                             | |
| +------------------------------+  | [ set row ]                             | |
|                                    +-----------------------------------------+ |
|                                                        [ Save workout ]        |
+--------------------------------------------------------------------------------+
| Shared footer                                                                  |
+--------------------------------------------------------------------------------+
```

**Phone**

```text
+----------------------------+
| IronBase   Workout Log     |
+----------------------------+
| [ Workout header ]         |
| Date / session focus       |
|                            |
| [ Exercise selector ]      |
|                            |
| [ Weight input ]           |
| [ Reps input ]             |
| [ RPE input ]              |
| [ Add set ]                |
|                            |
| Logged sets                |
| [ set row ]                |
| [ set row ]                |
|                            |
| [ Save workout ]           |
+----------------------------+
| Dashboard | Log | Exercises|
| History                    |
+----------------------------+
```

### Exercise History box sketches

**Desktop**

```text
+--------------------------------------------------------------------------------+
| IronBase | Dashboard | Workout Log | Exercise History | Workout History       |
+--------------------------------------------------------------------------------+
| Exercise History                                                               |
| +-----------------------------+  +-------------------------------------------+ |
| | Exercise selector           |  | Performance comparison                    | |
| | (choose a compound lift)    |  | (previous performances over time)         | |
| +-----------------------------+  +-------------------------------------------+ |
|                                                                                |
| +------------------------------------------------------------------------- --+ |
| | Previous-performance rows                                                | |
| +------------------------------------------------------------------------- --+ |
+--------------------------------------------------------------------------------+
| Shared footer                                                                  |
+--------------------------------------------------------------------------------+
```

**Phone**

```text
+----------------------------+
| IronBase Exercise History  |
+----------------------------+
| [ Exercise selector ]      |
|                            |
| [ Performance comparison ] |
|                            |
| Previous performances      |
| [ performance row ]        |
| [ performance row ]        |
+----------------------------+
| Dashboard | Log | Exercises|
| History                    |
+----------------------------+
```

### Workout History box sketches

**Desktop**

```text
+--------------------------------------------------------------------------------+
| IronBase | Dashboard | Workout Log | Exercise History | Workout History       |
+--------------------------------------------------------------------------------+
| Workout History                                                                |
| +------------------------------------------------------------------------- --+ |
| | Completed workout row: date | session focus | expand / delete            | |
| +------------------------------------------------------------------------- --+ |
| | Expanded row (when selected): logged-set details                         | |
| +------------------------------------------------------------------------- --+ |
| | Completed workout row: date | session focus | expand / delete            | |
| +------------------------------------------------------------------------- --+ |
+--------------------------------------------------------------------------------+
| Shared footer                                                                  |
+--------------------------------------------------------------------------------+
```

**Phone**

```text
+----------------------------+
| IronBase Workout History   |
+----------------------------+
| [ Workout card ]           |
| Date / session focus       |
| [ Expand ] [ Delete ]      |
|                            |
| [ Expanded logged sets ]   |
|                            |
| [ Workout card ]           |
+----------------------------+
| Dashboard | Log | Exercises|
| History                    |
+----------------------------+
```

## Step C: Break it into a component tree (10 min)

The busiest screen is **Workout Log**. Each repeated set row should be built once and rendered from the logged-set data, rather than copied into the page.

```text
App
└── AppShell
    ├── HeaderNav (desktop) / MobileBottomNav (phone)
    ├── MainContent
    │   └── WorkoutLogPage
    │       ├── WorkoutHeader
    │       │   └── WorkoutMetaFields
    │       ├── ExerciseSelector
    │       ├── SetEntryPanel
    │       │   └── SetInputRow
    │       ├── LoggedSetsList
    │       │   └── LoggedSetRow (repeats for each logged set)
    │       └── WorkoutActions
    └── Footer (desktop)
```

| Level | What it is | Your components |
| ----- | ---------- | --------------- |
| **Atoms** | Smallest reusable controls and display pieces. | `Button`, `IconButton`, `Label`, `TextInput`, `NumberInput`, `Select`, `SectionHeading` |
| **Molecules** | Small groups of atoms that perform one focused job. | `NavItem`, `WorkoutMetaFields`, `ExerciseSelector`, `SetInputRow`, `LoggedSetRow` |
| **Organisms** | Complete, self-contained sections of the Workout Log. | `HeaderNav`, `MobileBottomNav`, `WorkoutHeader`, `SetEntryPanel`, `LoggedSetsList`, `WorkoutActions`, `Footer` |
| **Page / layout** | The route-level screen and shared structure that arrange organisms. | `App`, `AppShell`, `MainContent`, `WorkoutLogPage` |

- **Repeated components:** `LoggedSetRow` is rendered once per logged set, using a stable key; it is not copied by hand for every set.
- **Dependency direction:** atoms do not import molecules or organisms. For example, `NumberInput` can be used inside `SetInputRow`, but `NumberInput` never imports `LoggedSetsList`.

## Step D: Sanity check (5 min)

**Main task: log a workout.**

1. The lifter lands on the **Dashboard** and chooses **Log workout**.
2. **Workout Log** opens with the workout header, where the lifter records or changes the date and session focus.
3. The lifter chooses a compound exercise in the in-screen exercise selector, enters weight, reps, and RPE, then adds a set.
4. The new `LoggedSetRow` appears in the logged-set list. The lifter can add or edit more sets, then select another exercise without leaving Workout Log; the earlier sets remain attached to their exercise.
5. The lifter selects **Save workout**. The completed workout is added to history and the app returns to the **Dashboard**, where the recent-workout overview can reflect the saved session.
6. The lifter can later use **Workout History** to review the completed session or **Exercise History** to compare prior performances for a selected exercise.

No additional route is required for selecting an exercise, adding/editing a set, expanding a past workout, or confirming a save. Those are all interactions within the four planned screens.

### State ownership check

| Proposal state | Owner | Components that use it during the main task |
| -------------- | ----- | ------------------------------------------- |
| Current workout: `{ id, date, sessionFocus }` | `WorkoutLogPage` | `WorkoutHeader`, `WorkoutMetaFields`, `WorkoutActions` |
| Exercises: `[{ id, name, muscleGroup }]` | `App` | `WorkoutLogPage`, `ExerciseSelector`, `ExerciseHistory` |
| Logged sets: `[{ exerciseId, weight, reps, RPE }]` | `WorkoutLogPage` | `SetEntryPanel`, `LoggedSetsList`, repeated `LoggedSetRow` components |
| Selected exercise: `exerciseId` | `WorkoutLogPage` | `ExerciseSelector`, `SetEntryPanel`, `LoggedSetsList` |
| Workout history: `[{ id, date, sessionFocus, sets }]` | `App` | `Dashboard`, `WorkoutHistory`, `ExerciseHistory`; updated when Workout Log saves or Workout History deletes a workout |

The ownership plan covers each piece of state from the proposal. `WorkoutLogPage` owns only the active workout data that changes while logging; `App` owns the exercise list and saved workout history that multiple routes need.

## What to keep

- The screen map becomes the four React routes and their shared navigation.
- The box sketches become the initial React components and page layouts.
- The component tree becomes the starting structure for `src/components/` using the atomic-design folders above.
- The phone stacking notes become the mobile-first CSS rules; desktop adds the horizontal navigation and multi-column layouts at a responsive breakpoint.
