# Net Calorie Tracker

## 1. Project Overview

Net Calorie Tracker is a full-stack web application built using the MEAN stack (MongoDB, Express.js, Angular, Node.js) for a technical hiring assessment. The application calculates and tracks daily net calories for registered users by combining their Basal Metabolic Rate (BMR), dietary food consumption, and physical activity logs according to the assessment specifications.

---

## 2. Key Features

- **User Registration and Metrics**: Captures user profiles (name, weight in kg, height in cm, gender, date of birth) with real-time age and BMR calculation previews during registration.
- **User Directory**: Displays all registered users with their calendar-calculated age and BMR, client-side name filtering, direct navigation to daily and multi-date records, and user deletion with confirmation.
- **Daily Net Calorie Tracking**: Displays daily caloric balance (food calories in, BMR, physical activity calories burned, and net surplus or deficit).
- **Single BMR Deduction per Calendar Day**: BMR is deducted once per user per calendar day regardless of the number of food or activity entries logged for that day.
- **30-Day Date Boundary Restriction**: Date navigation and logging are restricted to the past 30 calendar days up to the current date (`today - 30 days` to `today` inclusive).
- **Multi-Date Historical Records**: Tabular summary of all recorded dates for a user, listing daily totals (Calories In, Calories Out, BMR, and Net Calories).
- **Searchable Food and Activity Selection**: Autocomplete dropdowns for selecting food items and physical activities from imported reference datasets.
- **Idempotent Database Seeding**: Batch seed script that loads Excel datasets into MongoDB using upsert operations, preventing duplicate entries across repeated executions.
- **Cascading User Deletion**: Deleting a user automatically removes all associated daily records and nested entries.

---

## 3. Tech Stack

### Backend
| Technology | Declared Version (`package.json`) | Installed Version (`package-lock.json`) | Role |
|---|---|---|---|
| Node.js | `>=18.0.0` | Node.js Runtime | JavaScript runtime |
| Express | `^4.19.2` | `4.22.3` | REST API framework |
| Mongoose | `^8.5.2` | `8.24.6` | MongoDB ODM |
| SheetJS (`xlsx`) | `^0.18.5` | `0.18.5` | Excel workbook parser (`.xlsx`) |
| Helmet | `^8.3.0` | `8.3.0` | HTTP security headers |
| CORS | `^2.8.5` | `2.8.6` | Cross-origin resource sharing |
| Dotenv | `^16.4.5` | `16.6.1` | Environment variable loader |
| Jest | `^29.7.0` | `29.7.0` | Test runner and assertion library |
| Supertest | `^7.0.0` | `7.3.1` | HTTP integration test harness |
| mongodb-memory-server | `^9.2.0` | `9.5.0` | In-memory MongoDB instance for automated tests |

### Frontend
| Technology | Declared Version (`package.json`) | Installed Version (`package-lock.json`) | Role |
|---|---|---|---|
| Angular | `^22.2.0` | `22.2.3` | Standalone component web framework |
| TypeScript | `~6.0.2` | `6.0.3` | Typed language layer |
| RxJS | `~7.8.0` | `7.8.2` | Reactive streams and observables |
| Angular Build / CLI | `^22.2.4` | `22.2.4` | Build system (`@angular/build:application`) |
| Vitest | `^5.0.0` | `5.0.5` | Unit test runner |
| JSDOM | `^30.0.0` | `30.1.3` | DOM environment simulation for tests |

---

## 4. Main Project Structure

```
calorie-tracker-assignment-master/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js               # MongoDB connection handler
│   │   ├── controllers/
│   │   │   ├── activity.controller.js    # Activity search and category queries
│   │   │   ├── food.controller.js        # Food search, groups, and lookup
│   │   │   ├── record.controller.js      # Daily records and food/activity entry CRUD
│   │   │   └── user.controller.js        # User CRUD and cascading deletion
│   │   ├── middleware/
│   │   │   ├── error.middleware.js       # Centralized 404 and 500 error handlers
│   │   │   └── validator.middleware.js   # Input validation (ObjectIDs, dates, payloads)
│   │   ├── models/
│   │   │   ├── Activity.js               # Activity schema with compound index
│   │   │   ├── DailyRecord.js            # Daily entry schema with embedded logs
│   │   │   ├── Food.js                   # Food schema with unique foodId index
│   │   │   └── User.js                   # User profile schema
│   │   ├── routes/
│   │   │   ├── activity.routes.js        # /api/activities routes
│   │   │   ├── food.routes.js            # /api/foods routes
│   │   │   ├── record.routes.js          # /api/users/:userId/records routes
│   │   │   └── user.routes.js            # /api/users routes
│   │   ├── scripts/
│   │   │   └── seed.js                   # Idempotent Excel dataset importer
│   │   ├── services/
│   │   │   └── calorie.service.js        # Calculation formulas (BMR, activity, net)
│   │   └── app.js                        # Express application configuration
│   ├── tests/                            # Jest automated test suites
│   ├── .env.example                      # Environment variable template
│   ├── package.json                      # Backend scripts and dependencies
│   └── server.js                         # HTTP server entry point
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                     # TypeScript interfaces and HTTP services
│   │   │   ├── features/user/pages/      # Feature views (sign-up, user-list, user-data, user-details)
│   │   │   ├── shared/components/        # Reusable UI components
│   │   │   │   ├── add-data-modal/       # Modal for logging foods and activities
│   │   │   │   ├── breadcrumb/           # Breadcrumb navigation component
│   │   │   │   ├── confirm-dialog/       # Confirmation dialog component
│   │   │   │   ├── custom-datepicker/    # Date picker enforcing 30-day window
│   │   │   │   ├── empty-state/          # Empty table display component
│   │   │   │   ├── loading-state/        # Loading spinner component
│   │   │   │   ├── navbar/               # Global navigation bar
│   │   │   │   ├── searchable-dropdown/  # Filterable dropdown component
│   │   │   │   └── toast/                # Status notification component
│   │   │   ├── app.config.ts             # Application routing and client providers
│   │   │   ├── app.routes.ts             # Root route declarations
│   │   │   └── app.ts                    # Root component
│   │   ├── public/assets/                # Reference styles, fonts, and images
│   │   └── styles.css                    # Global application styles
│   ├── angular.json                      # Angular CLI project configuration
│   ├── package.json                      # Frontend scripts and dependencies
│   └── run-tests.js                      # Cross-platform Vitest runner script
│
├── data-excels-for-db/                   # Source Excel datasets
│   ├── food-calories.xlsx                # Food items and caloric values (14,164 records)
│   └── MET-values.xlsx                   # Physical activities and MET ratings (821 records)
│
├── supporting-htmls/                     # Reference screen mockups from assignment
└── README.md
```

---

## 5. Calculation Formulas and Business Rules

All calculation logic is implemented in `backend/src/services/calorie.service.js` as pure functions and matched on the client for registration and logging previews.

### 1. Calendar Age Calculation
Computed in whole completed years using Date of Birth relative to the reference date, accounting for whether the birthday has occurred in the target year:
```
age = refYear - birthYear (- 1 if birthday has not occurred yet this calendar year)
```

### 2. Basal Metabolic Rate (Harris-Benedict Equations)
- **Men**:
  ```
  BMR = 66.4730 + (13.7516 * weight_kg) + (5.0033 * height_cm) - (6.7550 * age_years)
  ```
- **Women**:
  ```
  BMR = 655.0955 + (9.5634 * weight_kg) + (1.8496 * height_cm) - (4.6756 * age_years)
  ```

### 3. Physical Activity Calories Burned
Calculated using the Metabolic Equivalent of Task (MET) value and duration in hours:
```
Calories Out = MET * weight_kg * (duration_minutes / 60)
```

### 4. Food Intake Calories
Calculated from serving portions:
```
Calories In = base_calories_per_serving * portion
```

### 5. Net Calories
```
Net Calories = Total Calories In - BMR - Total Calories Out
```
- **Single BMR Deduction Rule**: BMR is subtracted once per user per calendar day. Adding, modifying, or removing food or activity items recalculates calories consumed and burned while BMR is deducted once for that day.

### 6. Date Range Restriction
Permitted dates are constrained to:
```
(today - 30 days) <= date <= today
```
Enforced on the backend in `backend/src/middleware/validator.middleware.js` and in the frontend via `frontend/src/app/shared/components/custom-datepicker`.

---

## 6. Prerequisites and Installation

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or a MongoDB Atlas connection string.

### Installation

1. **Backend**:
   ```bash
   cd backend
   npm install
   ```

2. **Frontend**:
   ```bash
   cd ../frontend
   npm install
   ```

---

## 7. Environment Configuration

Backend configuration values are read from a `.env` file in the `backend/` directory. A template is provided at `backend/.env.example`.

### Setup

```bash
# In the backend directory:
# On macOS / Linux:
cp .env.example .env

# On Windows (Command Prompt):
copy .env.example .env

# On Windows (PowerShell):
Copy-Item .env.example .env
```

### Configuration Variables

| Variable | Description | In-Code Default | `.env.example` Value |
|---|---|---|---|
| `PORT` | Port for the Express server | `5000` | `5000` |
| `MONGODB_URI` | MongoDB connection URI | *Required (no fallback in code)* | `mongodb://localhost:27017/calorie_tracker` |
| `NODE_ENV` | Application environment (`development`, `production`, `test`) | `undefined` | `development` |
| `CLIENT_ORIGIN` | Allowed CORS origin for the frontend client | `http://localhost:4200` | `http://localhost:4200` |

*Note: Automated backend tests execute against an isolated in-memory database (`mongodb-memory-server`) and do not connect to or alter the database specified in `MONGODB_URI`.*

---

## 8. Database Seeding

The seed script imports the Excel datasets located in `data-excels-for-db/` into MongoDB:
- `food-calories.xlsx`: 14,164 records imported into the `foods` collection. The original spreadsheet `ID` is preserved as `foodId`.
- `MET-values.xlsx`: 821 records imported into the `activities` collection. A deterministic identifier `ACT-<md5(activity+motion+met)>` is generated to disambiguate rows sharing the same activity name.

The script executes batch operations (`bulkWrite` with `upsert: true`) in chunks of 500 records with real-time console progress updates. It is safe to re-run without creating duplicate records or modifying existing user data.

To seed the database:
```bash
cd backend
npm run seed
```

---

## 9. Running the Backend and Frontend

Run the backend and frontend in separate terminal windows.

### 1. Start the Backend API
```bash
cd backend
npm run dev
```
- Starts the Express server with `nodemon` on `http://localhost:5000`.
- Alternatively, use `npm start` to run with `node server.js`.
- Health check endpoint is available at `http://localhost:5000/api/health`.

### 2. Start the Frontend Client
```bash
cd frontend
npm start
```
- Starts the Angular development server (`ng serve`) on `http://localhost:4200`.
- Open a browser and navigate to `http://localhost:4200`.

---

## 10. Running Tests and Building the Frontend

### Backend Tests
The backend test suite uses Jest and Supertest against an in-memory database (`mongodb-memory-server`).

```bash
cd backend
npm test
```
- **Command executed**: `jest --runInBand --detectOpenHandles --forceExit`
- **Verified results**: 8 test suites passed, 82 tests passed, 0 failures.

### Frontend Tests
The frontend test suite uses Vitest with JSDOM. A wrapper script (`run-tests.js`) resolves short paths on Windows environments where directory names contain special characters (such as parentheses).

```bash
cd frontend
npm test
```
- **Command executed**: `node run-tests.js`
- **Verified results**: 7 test suites passed, 31 tests passed, 0 failures.

### Frontend Production Build
To generate an optimized production bundle:

```bash
cd frontend
npm run build
```
- **Command executed**: `ng build`
- **Output location**: `frontend/dist/frontend/` (browser application bundles).
- Configured with bundle budgets and output hashing in `frontend/angular.json`.

---

## 11. API Endpoint Overview

All API endpoints are prefixed with `/api`.

### Health Check
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns service status, uptime, and timestamp |

### Users
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/users` | Register a new user (body: `name`, `weight`, `height`, `gender`, `dateOfBirth`) |
| `GET` | `/api/users` | List all users with calculated age and BMR |
| `GET` | `/api/users/:id` | Get user details by MongoDB ObjectId |
| `DELETE` | `/api/users/:id` | Delete user and cascade-delete all associated daily records |

### Foods
| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/api/foods` | `search`, `group`, `limit` (default: 100, max: 500) | Search foods by name or food group |
| `GET` | `/api/foods/groups` | — | Retrieve distinct food groups list |
| `GET` | `/api/foods/:foodId` | — | Lookup food by numeric `foodId` |

### Activities
| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/api/activities` | `search`, `category`, `limit` (default: 100, max: 500) | Search activities by specific motion or activity category |
| `GET` | `/api/activities/categories` | — | Retrieve distinct activity categories list |

### Daily Records
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/:userId/records` | Retrieve all historical daily records for a user |
| `GET` | `/api/users/:userId/records/:date` | Get record for a date (`YYYY-MM-DD`). Returns baseline BMR if no entries exist |
| `POST` | `/api/users/:userId/records/:date/foods` | Add food entry (body: `foodId`, `portion`, `mealType`) |
| `DELETE` | `/api/users/:userId/records/:date/foods/:entryId` | Remove food entry and recalculate daily totals |
| `POST` | `/api/users/:userId/records/:date/activities` | Add activity entry (body: `activityId`, `durationMinutes`) |
| `DELETE` | `/api/users/:userId/records/:date/activities/:entryId` | Remove activity entry and recalculate daily totals |