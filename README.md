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

## Future Roadmap: Part 2 (Website Version)

Having validated all core business logic and class boundaries in the C++ console engine, the upcoming development phase transitions CampusGig into a modern web ecosystem:

1. **Frontend Single-Page Application (SPA)**:
   - Interactive UI built using **React.js**.
   - Responsive client dashboards, proposal editors, and marketplace search filters.
2. **C++ Microservice Backend**:
   - Lightweight C++ REST API powered by **Crow** or **Pistache**.
   - 100% reuse of the validated `User`, `Job`, `Application`, and `Platform` OOP business classes.
3. **Relational Database Storage**:
   - Seamless schema migration from flat-file pipe-delimited text to an ACID-compliant SQL database (**SQLite** or **MySQL**).
4. **JWT Authentication & Security**:
   - Secure token-based session handling, college SSO / email confirmation tokens.