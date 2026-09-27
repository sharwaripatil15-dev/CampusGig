# CampusGig — A College Freelancing Platform

[![C++17](https://img.shields.io/badge/C%2B%2B-17-blue.svg)](https://en.cppreference.com/w/cpp/17)
[![Status](https://img.shields.io/badge/Status-Part%201%3A%20Console%20Complete-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Every college campus runs on micro-gigs that never make it to conventional job boards — tutoring for an upcoming midterm, logo and poster designs for a club hackathon, event photography, or quick computer hardware troubleshooting. 

**CampusGig** bridges this campus gap: a verified digital marketplace connecting students, faculty, and campus-affiliated clients with talented student freelancers who can deliver.

> **Project Phase Notice**: This repository completes **Part 1: Console Version** (pure C++17 object-oriented core). The next phase is **Part 2: Website Version** (React.js frontend + C++ REST API backend).

---

## Table of Contents
- [Architecture & Design Patterns](#architecture--design-patterns)
- [Class Hierarchy](#class-hierarchy)
- [New Features & Improvements (Part 1 Completion)](#new-features--improvements-part-1-completion)
  - [1. College-Email Verification for Freelancers](#1-college-email-verification-for-freelancers)
  - [2. Factory Method Refactor](#2-factory-method-refactor)
  - [3. Job Search / Keyword Browsing](#3-job-search--keyword-browsing)
  - [4. Input Validation Hardening](#4-input-validation-hardening)
  - [5. Pipe-Delimited File Persistence](#5-pipe-delimited-file-persistence)
- [File Structure](#file-structure)
- [Building and Running](#building-and-running)
- [End-to-End Walkthrough](#end-to-end-walkthrough)
- [Future Roadmap: Part 2 (Website Version)](#future-roadmap-part-2-website-version)

---

## Architecture & Design Patterns

The platform is designed around the four core Object-Oriented Programming (OOP) pillars:
- **Abstraction**: Abstract base class `User` establishes the contract for authentication, information display, and interactive role menus.
- **Inheritance**: `Client`, `Freelancer`, and `Admin` extend `User`, inheriting base identity fields and specializing role behaviors.
- **Polymorphism**: The central engine dispatches `currentUser->displayMenu(platform)` polymorphically at runtime based on the authenticated user's actual derived type.
- **Encapsulation**: Entity fields remain strictly private/protected, accessible solely via validated getters, setters, and business methods.
- **Factory Method Pattern**: User instantiation is unified within `Platform::createUser()`, centralizing type mapping and eliminating code duplication across registration and flat-file loading.

---

## Class Hierarchy

```
                      +-------------------+
                      |       User        | (Abstract Base)
                      |-------------------|
                      | - id: int         |
                      | - name: string    |
                      | - email: string   |
                      | - password: string|
                      | - role: string    |
                      +---------+---------+
                                |
        +-----------------------+-----------------------+
        |                       |                       |
+-------v-------+       +-------v-------+       +-------v-------+
|    Client     |       |  Freelancer   |       |     Admin     |
+---------------+       +---------------+       +---------------+
| + postJob()   |       | + browseJobs()|       | + viewUsers() |
| + hire()      |       | + searchJobs()|       | + viewJobs()  |
| + markDone()  |       | + applyJob()  |       | + removeUser()|
+---------------+       +---------------+       +---------------+

Entities:
- Job: id, title, description, budget, status, clientId, applicantIds
- Application: jobId, freelancerId, proposedPrice, status
- Platform: owns User*, Job, Application collections, controller loop, persistence
```

---

## New Features & Improvements (Part 1 Completion)

### 1. College-Email Verification for Freelancers
- Trust is the foundational pillar of CampusGig. While Clients and Admins can sign up with general email addresses, **Freelancer** accounts are restricted to verified institutional emails.
- Configured via a constant near the top of `Platform.cpp`:
  ```cpp
  const std::string COLLEGE_EMAIL_DOMAIN = "@vit.edu";
  ```
- If an applicant attempts to register as a Freelancer without the designated domain, the system rejects the registration, provides feedback, and avoids consuming auto-incrementing user IDs.

### 2. Factory Method Refactor
- Replaced inline `if/else` user instantiation blocks with a dedicated factory method:
  ```cpp
  User* Platform::createUser(int id, const std::string& role, const std::string& name,
                             const std::string& email, const std::string& password);
  ```
- Reused cleanly in two critical places:
  1. `Platform::registerUser()` for interactive signups.
  2. `Platform::loadData()` when deserializing `users.txt`.

### 3. Job Search / Keyword Browsing
- Freelancers can browse open gigs not just sequentially, but via targeted keyword matching.
- Accessible directly from the **Freelancer Menu**:
  ```
  Option 2: Search Jobs by Keyword
  ```
- Features case-insensitive substring searching across both job **titles** and **descriptions**, displaying results in the unified `Job::display()` format.

### 4. Input Validation Hardening
- **Stream State Protection**: All numeric menu choices (`cin >> choice`) are wrapped inside `Platform::getValidatedInt()`. Entering characters, strings, or invalid tokens no longer triggers stream failure flags or infinite loops.
- **Strict Positive Quantities**: Budget inputs during job postings and proposed price bids during proposal submissions reject zero and negative values via `Platform::getValidatedPositiveDouble()`, displaying a helpful error message and reprompting.

### 5. Pipe-Delimited File Persistence
Session durability is guaranteed via pipe-delimited flat files:
- `users.txt`: `id|role|name|email|password`
- `jobs.txt`: `id|title|description|budget|status|clientId|applicantId1,applicantId2`
- `applications.txt`: `jobId|freelancerId|proposedPrice|status`

---

## File Structure

```
CampusGig-Console-/
├── User.h             # Base User interface & Client/Freelancer/Admin declarations
├── User.cpp           # User implementations and polymorphic menu workflows
├── Client.h           # Convenience forward header
├── Freelancer.h       # Convenience forward header
├── Admin.h            # Convenience forward header
├── Job.h              # Job entity declaration
├── Job.cpp            # Job entity formatting and applicant list tracking
├── Application.h      # Application proposal entity declaration
├── Application.cpp    # Application proposal implementation
├── Platform.h         # Controller header, factory method signature, validation helpers
├── Platform.cpp       # Controller logic, persistence, email validation, keyword search
├── main.cpp           # Program entry point and top-level exception handling
├── Makefile           # Compilation automation for g++ (C++17)
└── README.md          # Project documentation and architectural overview
```

## Building and Running (Complete Step-by-Step Guide)

### Prerequisites
- Modern C++ compiler supporting **C++17** (`g++`, `clang++`, or MSVC).
- *(Windows)* MinGW-w64 (`g++`) with UCRT is supported out of the box.

---

### Step 1: Open Terminal & Navigate to Project Directory

Open **PowerShell**, **Command Prompt**, or the integrated terminal in **VS Code**:

```powershell
cd "e:\Git Hub\CampusGig-Console-"
```

---

### Step 2: Run the Pre-Built Executable

If [`campusgig.exe`](file:///e:/Git%20Hub/CampusGig-Console-/campusgig.exe) is already compiled in the directory, simply execute:

```powershell
.\campusgig.exe
```

---

### Step 3: Compile From Source (Single-Command Build)

To recompile all source files into a 100% standalone Windows executable (with all standard C++ libraries bundled):

```powershell
g++ -std=c++17 -Wall -Wextra -O2 -static -static-libgcc -static-libstdc++ -o campusgig.exe main.cpp Platform.cpp User.cpp Job.cpp Application.cpp
```

Then launch:

```powershell
.\campusgig.exe
```

> **Why `-static -static-libgcc -static-libstdc++`?**
> On Windows, static linking embeds `libstdc++` and `libwinpthread` directly inside `campusgig.exe`. This ensures the application never crashes from missing DLLs and can be copied or double-clicked anywhere.

---

### Step 4: Using `make` (Automated Build & Execution)

If `make` is installed on your system:

```powershell
# 1. Compile the standalone binary
make

# 2. Run the application
make run

# 3. Clean object files, binary, and reset flat-file databases
make clean
```

---

### Step 5: For Linux / macOS Systems

```bash
# Compile with C++17
g++ -std=c++17 -Wall -Wextra -O2 -o campusgig main.cpp Platform.cpp User.cpp Job.cpp Application.cpp

# Run
./campusgig
```

---

### Step 6: Resetting Database / Fresh Start

All user accounts, job postings, and proposals persist across runs in pipe-delimited text files (`users.txt`, `jobs.txt`, `applications.txt`). To start with a fresh database:

```powershell
# In PowerShell:
Remove-Item users.txt, jobs.txt, applications.txt -ErrorAction SilentlyContinue
```
*(or run `make clean`)*

---

### ⚡ Quick Copy-Paste One-Liners

**1. Directly Run:**
```powershell
cd "e:\Git Hub\CampusGig-Console-"; .\campusgig.exe
```

**2. Recompile & Run:**
```powershell
cd "e:\Git Hub\CampusGig-Console-"; g++ -std=c++17 -Wall -Wextra -O2 -static -static-libgcc -static-libstdc++ -o campusgig.exe main.cpp Platform.cpp User.cpp Job.cpp Application.cpp; .\campusgig.exe
```

---

## End-to-End Walkthrough

1. **Register Admin**:
   - Register user: `Role: Admin`, `Name: Campus Admin`, `Email: admin@campusgig.internal`, `Password: admin123`.
2. **Register Client**:
   - Register user: `Role: Client`, `Name: Tech Club`, `Email: techclub@gmail.com`, `Password: club123`.
3. **Register Freelancer (Verified Student)**:
   - Attempt invalid email: `student@gmail.com` $\rightarrow$ Rejected (requires `@vit.edu`).
   - Register valid email: `alex@vit.edu` $\rightarrow$ Success!
4. **Post Job**:
   - Login as `techclub@gmail.com`.
   - Post Job: Title: `Hackathon Website Banner`, Budget: `$75.00`.
5. **Search & Apply**:
   - Login as `alex@vit.edu`.
   - Select `Search Jobs by Keyword` $\rightarrow$ Query: `banner`.
   - Apply for Job with proposed price: `$70.00`.
6. **Hiring Workflow**:
   - Login as `techclub@gmail.com`.
   - View Applicants $\rightarrow$ Select Freelancer to hire.
   - Job updates to `InProgress`; applicant status updates to `Accepted`.
7. **Complete Job**:
   - Mark Job complete once delivered $\rightarrow$ Status updates to `Completed`.

---

---

## Part 2: Website Version

Part 2 delivers a full modern web application that wraps and reuses the exact C++ OOP core logic without rewriting the business rules.

```
                          +-------------------------------------------------+
                          |           React Frontend (Port 3000)            |
                          |  - React Router + AuthContext + Modern CSS UI   |
                          |  - Role-based Views (Client/Freelancer/Admin)   |
                          +-----------------------+-------------------------+
                                                  |
                                    REST API (JSON over HTTP)
                                    CORS Enabled + Session Token
                                                  |
                          +-----------------------v-------------------------+
                          |         Crow C++ REST Server (Port 8080)        |
                          |  - server.cpp (Crow microframework routes)      |
                          +-----------------------+-------------------------+
                                                  |
                              In-Process Reuse (No Rewrite of Logic)
                                                  |
     +--------------------------------------------v--------------------------------------------+
     |                                C++ OOP Domain Core                                      |
     |  Platform.h / Platform.cpp (Engine, validation rules, search & lifecycle logic)         |
     |  User.h / User.cpp (Abstract User, Client, Freelancer, Admin)                           |
     |  Job.h / Job.cpp                                                                        |
     |  Application.h / Application.cpp                                                        |
     +--------------------------------------------+--------------------------------------------+
                                                  |
                                   Flat-File Pipe Persistence
                                                  |
                         +------------------------v------------------------+
                         | users.txt  |  jobs.txt  |  applications.txt    |
                         +-------------------------------------------------+
```

### 1. Technology Stack
- **Backend**: C++17, [Crow C++ Web Framework](https://crowcpp.org/) (`crow_all.h`), standalone Asio, WinSock2 (`-lws2_32 -lmswsock`).
- **Frontend**: React 18 / Vite, React Router DOM, Lucide Icons, Vanilla Modern CSS with Glassmorphism & Responsive Design.
- **Persistence**: Retains the flat-file pipe-delimited format (`users.txt`, `jobs.txt`, `applications.txt`).

---

### 2. REST API Endpoints Overview

| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `GET` | `/` | Public | System status and service health check |
| `POST` | `/api/register` | Public | Register user (`name, email, password, role`). Enforces `@vit.edu` for Freelancer. |
| `POST` | `/api/login` | Public | Authenticates credentials, returns user details and session token |
| `POST` | `/api/logout` | Authenticated | Invalidates active session token |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current authenticated user profile |
| `GET` | `/api/jobs` | Public | Lists open jobs (supports `?search=keyword` case-insensitive query) |
| `POST` | `/api/jobs` | Client | Creates a new job (`title, description, budget > 0`) |
| `GET` | `/api/client/jobs` | Client | Lists all jobs created by the authenticated client |
| `GET` | `/api/jobs/:id/applicants` | Client (Owner) | Lists applicants and proposed prices for a job |
| `POST` | `/api/jobs/:id/apply` | Freelancer | Submits application with `proposedPrice > 0` |
| `POST` | `/api/jobs/:id/hire` | Client (Owner) | Hires applicant: accepts selected freelancer, rejects others, moves job to `InProgress` |
| `POST` | `/api/jobs/:id/complete` | Client (Owner) | Marks job as `Completed` |
| `GET` | `/api/applications/me` | Freelancer | Lists student's submitted proposals and review status |
| `GET` | `/api/admin/users` | Admin | Lists all registered users (excluding sensitive passwords) |
| `DELETE` | `/api/admin/users/:id` | Admin | Removes user with cascading deletion of jobs/applications |
| `GET` | `/api/admin/jobs` | Admin | Oversees all jobs across the system |

---

### 3. Step-by-Step Installation & Execution

#### Prerequisites
- **C++17 Compiler**: GCC / MinGW-w64 `g++` (installed with MSYS2 or standalone).
- **Node.js**: v18+ and `npm` (v10+).

#### Running the Backend (Port 8080)

1. Open a terminal in the project root (`CampusGig`):
   ```powershell
   # Compile both console and REST API server
   mingw32-make all
   ```
   *(or compile directly with g++)*:
   ```powershell
   g++ -std=c++17 -Wall -Wextra -O2 -Iinclude server.cpp Platform.cpp User.cpp Job.cpp Application.cpp -lws2_32 -lmswsock -o campusgig_server.exe
   ```

2. Start the server:
   ```powershell
   .\campusgig_server.exe 8080
   ```
   The backend will print:
   ```
   ========================================================
     CAMPUSGIG REST API SERVER STARTED ON PORT 8080
     Base URL: http://localhost:8080
     CORS enabled for frontend clients
   ========================================================
   ```

#### Running the Frontend (Port 3000)

1. In a second terminal window, navigate to `frontend`:
   ```powershell
   cd frontend
   npm install
   ```

2. Start the Vite development server:
   ```powershell
   npm run dev
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

### 4. How the Two Connect

1. **CORS Support**: The C++ Crow backend implements `crow::CORSHandler` allowing cross-origin requests from `http://localhost:3000` (methods: `GET, POST, DELETE, OPTIONS, PUT`; headers: `Content-Type, Authorization, X-Session-Token`).
2. **Session Persistence**: When logging in or registering, the C++ server returns an authenticated token `cg_<hex>`. The React `AuthContext` stores this token in `localStorage` and automatically sends `Authorization: Bearer <token>` on all subsequent requests.
3. **Polymorphic Dashboard Dispatcher**: The React frontend uses a single `/dashboard` route that inspects the authenticated user's role and polymorphically renders:
   - `<ClientDashboard />` for Clients (post jobs, view applicants, hire, complete).
   - `<FreelancerDashboard />` for Freelancers (browse/search open gigs, apply with proposed price, track proposal status).
   - `<AdminDashboard />` for Administrators (directory moderation, delete users, view all marketplace jobs).
4. **Error Consistency**: The API returns identical validation errors to the console application (e.g. `"Freelancer accounts require a valid college email ending in @vit.edu."`), ensuring consistent UX voice across both platforms.

---

### 5. Automated API Verification Suite

To automatically verify all REST endpoints without a browser, run the included test suite:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\test_api.ps1
```