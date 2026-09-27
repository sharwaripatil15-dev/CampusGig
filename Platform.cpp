#include "Platform.h"
#include <fstream>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <cctype>

// ============================================================================
// CONFIGURATION
// ============================================================================
// Configurable college email domain required for Freelancer registration.
// Modify this constant to match your institution's email domain (e.g. "@vit.edu").
const std::string COLLEGE_EMAIL_DOMAIN = "@vit.edu";

// ============================================================================
// STRING HELPER UTILITIES
// ============================================================================
namespace {
    std::string toLowerString(const std::string& str) {
        std::string lower = str;
        std::transform(lower.begin(), lower.end(), lower.begin(),
                       [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
        return lower;
    }

    bool endsWith(const std::string& fullString, const std::string& ending) {
        if (fullString.length() < ending.length()) return false;
        std::string fullLower = toLowerString(fullString);
        std::string endLower = toLowerString(ending);
        return fullLower.compare(fullLower.length() - endLower.length(),
                                 endLower.length(), endLower) == 0;
    }

    std::vector<std::string> split(const std::string& str, char delimiter) {
        std::vector<std::string> tokens;
        std::stringstream ss(str);
        std::string token;
        while (std::getline(ss, token, delimiter)) {
            tokens.push_back(token);
        }
        return tokens;
    }
}

// ============================================================================
// CONSTRUCTOR & DESTRUCTOR
// ============================================================================
Platform::Platform() : currentUser(nullptr), nextUserId(1), nextJobId(1) {
    loadData();
}

Platform::~Platform() {
    saveData();
    for (User* user : users) {
        delete user;
    }
    users.clear();
}

// ============================================================================
// FACTORY METHOD (Requirement 2)
// ============================================================================
/**
 * Factory method that encapsulates role-to-class instantiation in one single place.
 * Used by both registerUser() for new accounts and loadData() during persistence loading.
 */
User* Platform::createUser(int id, const std::string& role, const std::string& name,
                           const std::string& email, const std::string& password) {
    if (role == "Client") {
        return new Client(id, name, email, password);
    } else if (role == "Freelancer") {
        return new Freelancer(id, name, email, password);
    } else if (role == "Admin") {
        return new Admin(id, name, email, password);
    }
    return nullptr;
}

// ============================================================================
// SYSTEM RUNTIME & MAIN MENU
// ============================================================================
void Platform::run() {
    bool running = true;
    while (running) {
        std::cout << "\n======================================================\n";
        std::cout << "     CAMPUSGIG: A COLLEGE FREELANCING PLATFORM        \n";
        std::cout << "======================================================\n";
        std::cout << "1. Login\n";
        std::cout << "2. Register New User\n";
        std::cout << "3. Exit System\n";
        std::cout << "------------------------------------------------------\n";

        int choice = getValidatedInt("Enter choice (1-3): ", 1, 3);
        switch (choice) {
            case 1:
                loginUser();
                break;
            case 2:
                registerUser();
                break;
            case 3:
                std::cout << "\nThank you for using CampusGig. Saving data and exiting...\n";
                saveData();
                running = false;
                break;
            default:
                break;
        }
    }
}

// ============================================================================
// USER REGISTRATION WITH COLLEGE EMAIL VERIFICATION (Requirement 1 & 2)
// ============================================================================
void Platform::registerUser() {
    std::cout << "\n------------------ USER REGISTRATION ------------------\n";
    std::cout << "Select Account Role:\n";
    std::cout << "1. Freelancer (Verified College Students)\n";
    std::cout << "2. Client     (Campus Clubs, Faculty, Businesses)\n";
    std::cout << "3. Admin      (Platform Administrator)\n";

    int roleChoice = getValidatedInt("Enter choice (1-3): ", 1, 3);
    std::string role;
    if (roleChoice == 1) {
        role = "Freelancer";
    } else if (roleChoice == 2) {
        role = "Client";
    } else {
        role = "Admin";
    }

    std::string name = getValidatedLine("Enter Full Name: ");
    std::string email = getValidatedLine("Enter Email Address: ");

    // Requirement 1: College-Email Verification for Freelancers
    if (role == "Freelancer") {
        if (!endsWith(email, COLLEGE_EMAIL_DOMAIN)) {
            std::cout << "\n[ERROR] Registration cancelled!\n";
            std::cout << "Freelancer accounts require a verified college email ending with: "
                      << COLLEGE_EMAIL_DOMAIN << "\n";
            std::cout << "Please register using your institutional email address.\n";
            return; // Exit without creating user or consuming nextUserId
        }
    }

    // Check if email already exists
    if (findUserByEmail(email) != nullptr) {
        std::cout << "\n[ERROR] An account with email \"" << email << "\" is already registered.\n";
        return;
    }

    std::string password = getValidatedLine("Enter Password: ");

    // Requirement 2: Clean Factory Method invocation
    User* newUser = createUser(nextUserId, role, name, email, password);
    if (newUser != nullptr) {
        users.push_back(newUser);
        nextUserId++;
        saveData();
        std::cout << "\n[SUCCESS] Registered successfully as " << role
                  << "! (User ID: " << newUser->getId() << ")\n";
    } else {
        std::cout << "\n[ERROR] Failed to instantiate user for role: " << role << "\n";
    }
}

// ============================================================================
// USER AUTHENTICATION & SESSION MANAGEMENT
// ============================================================================
void Platform::loginUser() {
    std::cout << "\n--------------------- USER LOGIN ---------------------\n";
    std::string email = getValidatedLine("Enter Email: ");
    std::string password = getValidatedLine("Enter Password: ");

    User* user = findUserByEmail(email);
    if (user != nullptr && user->getPassword() == password) {
        currentUser = user;
        std::cout << "\n[SUCCESS] Login successful! Welcome back, " << user->getName()
                  << " (" << user->getRole() << ").\n";

        // Polymorphic invocation of role-specific menu
        currentUser->displayMenu(*this);

        // Session termination
        currentUser = nullptr;
    } else {
        std::cout << "\n[ERROR] Invalid email or password. Please try again.\n";
    }
}

void Platform::logoutUser() {
    currentUser = nullptr;
    std::cout << "\n[INFO] You have been logged out.\n";
}

// ============================================================================
// CLIENT WORKFLOWS
// ============================================================================
void Platform::postJob(int clientId) {
    std::cout << "\n------------------- POST A NEW JOB -------------------\n";
    std::string title = getValidatedLine("Enter Job Title: ");
    std::string description = getValidatedLine("Enter Job Description: ");
    // Requirement 4: Budget hardened against <= 0
    double budget = getValidatedPositiveDouble("Enter Budget ($): ");

    Job newJob(nextJobId, title, description, budget, "Open", clientId);
    jobs.push_back(newJob);
    nextJobId++;
    saveData();

    std::cout << "\n[SUCCESS] Job posted successfully! (Job ID: " << newJob.getId() << ")\n";
}

void Platform::viewClientJobs(int clientId) const {
    std::cout << "\n------------------ YOUR POSTED JOBS ------------------\n";
    int count = 0;
    for (const auto& job : jobs) {
        if (job.getClientId() == clientId) {
            job.display();
            count++;
        }
    }
    if (count == 0) {
        std::cout << "No jobs posted yet.\n";
    }
}

void Platform::viewApplicantsForJob(int clientId) {
    viewClientJobs(clientId);
    int jobId = getValidatedInt("Enter Job ID to view applicants: ");

    Job* job = findJobById(jobId);
    if (!job || job->getClientId() != clientId) {
        std::cout << "\n[ERROR] Job not found or you do not have permission to view it.\n";
        return;
    }

    std::cout << "\n--- Applicants for Job #" << job->getId() << " (" << job->getTitle() << ") ---\n";
    int appCount = 0;
    for (const auto& app : applications) {
        if (app.getJobId() == jobId) {
            User* freelancer = findUserById(app.getFreelancerId());
            std::string name = freelancer ? freelancer->getName() : "Unknown";
            std::string email = freelancer ? freelancer->getEmail() : "Unknown";

            std::cout << "Freelancer ID: " << app.getFreelancerId()
                      << " | Name: " << name
                      << " | Email: " << email
                      << " | Proposed Price: $" << std::fixed << std::setprecision(2) << app.getProposedPrice()
                      << " | Status: " << app.getStatus() << "\n";
            appCount++;
        }
    }
    if (appCount == 0) {
        std::cout << "No applications submitted for this job yet.\n";
    }
}

void Platform::hireFreelancer(int clientId) {
    viewClientJobs(clientId);
    int jobId = getValidatedInt("Enter Job ID to hire for: ");

    Job* job = findJobById(jobId);
    if (!job || job->getClientId() != clientId) {
        std::cout << "\n[ERROR] Job not found or you do not have permission to modify it.\n";
        return;
    }

    if (job->getStatus() != "Open") {
        std::cout << "\n[ERROR] This job is currently \"" << job->getStatus()
                  << "\" and cannot accept new hires.\n";
        return;
    }

    // List pending applicants
    std::cout << "\nApplicants for Job #" << jobId << ":\n";
    std::vector<int> candidateIds;
    for (const auto& app : applications) {
        if (app.getJobId() == jobId && app.getStatus() == "Pending") {
            User* f = findUserById(app.getFreelancerId());
            std::cout << " - Freelancer ID: " << app.getFreelancerId()
                      << " (" << (f ? f->getName() : "N/A")
                      << ") | Proposed: $" << std::fixed << std::setprecision(2) << app.getProposedPrice() << "\n";
            candidateIds.push_back(app.getFreelancerId());
        }
    }

    if (candidateIds.empty()) {
        std::cout << "No pending applicants available for this job.\n";
        return;
    }

    int freelancerId = getValidatedInt("Enter Freelancer ID to hire: ");
    auto it = std::find(candidateIds.begin(), candidateIds.end(), freelancerId);
    if (it == candidateIds.end()) {
        std::cout << "\n[ERROR] Freelancer ID " << freelancerId << " is not an active applicant for this job.\n";
        return;
    }

    // Update applications and job status
    for (auto& app : applications) {
        if (app.getJobId() == jobId) {
            if (app.getFreelancerId() == freelancerId) {
                app.setStatus("Accepted");
            } else if (app.getStatus() == "Pending") {
                app.setStatus("Rejected");
            }
        }
    }

    job->setStatus("InProgress");
    saveData();
    std::cout << "\n[SUCCESS] Freelancer #" << freelancerId << " hired! Job status updated to InProgress.\n";
}

void Platform::markJobComplete(int clientId) {
    viewClientJobs(clientId);
    int jobId = getValidatedInt("Enter Job ID to mark as Complete: ");

    Job* job = findJobById(jobId);
    if (!job || job->getClientId() != clientId) {
        std::cout << "\n[ERROR] Job not found or not owned by you.\n";
        return;
    }

    if (job->getStatus() != "InProgress") {
        std::cout << "\n[ERROR] Job cannot be marked complete because status is \""
                  << job->getStatus() << "\" (must be InProgress).\n";
        return;
    }

    job->setStatus("Completed");
    saveData();
    std::cout << "\n[SUCCESS] Job #" << jobId << " marked as Completed! Thank you for using CampusGig.\n";
}

// ============================================================================
// FREELANCER WORKFLOWS
// ============================================================================
void Platform::browseOpenJobs() const {
    std::cout << "\n------------------- OPEN MARKETPLACE JOBS -------------------\n";
    int count = 0;
    for (const auto& job : jobs) {
        if (job.getStatus() == "Open") {
            job.display();
            count++;
        }
    }
    if (count == 0) {
        std::cout << "No open jobs currently available in the marketplace.\n";
    }
}

// Requirement 3: Job Search / Keyword Browsing for Freelancers
void Platform::searchJobsByKeyword() const {
    std::cout << "\n----------------- SEARCH JOBS BY KEYWORD -----------------\n";
    std::string keyword = getValidatedLine("Enter search keyword: ");
    std::string lowerKeyword = toLowerString(keyword);

    if (lowerKeyword.empty()) {
        std::cout << "[ERROR] Search keyword cannot be empty.\n";
        return;
    }

    std::cout << "\nSearching open jobs matching \"" << keyword << "\"...\n";
    int matchCount = 0;

    for (const auto& job : jobs) {
        if (job.getStatus() == "Open") {
            std::string titleLower = toLowerString(job.getTitle());
            std::string descLower = toLowerString(job.getDescription());

            // Case-insensitive match on title or description
            if (titleLower.find(lowerKeyword) != std::string::npos ||
                descLower.find(lowerKeyword) != std::string::npos) {
                job.display();
                matchCount++;
            }
        }
    }

    if (matchCount == 0) {
        std::cout << "\n[INFO] No open jobs found matching keyword: \"" << keyword << "\".\n";
    } else {
        std::cout << "\nFound " << matchCount << " matching job(s).\n";
    }
}

void Platform::applyForJob(int freelancerId) {
    browseOpenJobs();
    int jobId = getValidatedInt("Enter Job ID to apply for: ");

    Job* job = findJobById(jobId);
    if (!job || job->getStatus() != "Open") {
        std::cout << "\n[ERROR] Job ID not found or not currently Open.\n";
        return;
    }

    if (job->hasApplicant(freelancerId)) {
        std::cout << "\n[ERROR] You have already applied for this job.\n";
        return;
    }

    // Requirement 4: Proposed price hardened against <= 0
    double proposedPrice = getValidatedPositiveDouble("Enter Proposed Price ($): ");

    Application app(jobId, freelancerId, proposedPrice, "Pending");
    applications.push_back(app);
    job->addApplicant(freelancerId);
    saveData();

    std::cout << "\n[SUCCESS] Application submitted for Job #" << jobId << " at $"
              << std::fixed << std::setprecision(2) << proposedPrice << "!\n";
}

void Platform::viewFreelancerApplications(int freelancerId) const {
    std::cout << "\n------------------- YOUR APPLICATIONS -------------------\n";
    int count = 0;
    for (const auto& app : applications) {
        if (app.getFreelancerId() == freelancerId) {
            const Job* job = findJobById(app.getJobId());
            std::string jobTitle = job ? job->getTitle() : "Unknown Job";
            std::string jobStatus = job ? job->getStatus() : "Unknown";

            std::cout << "Job ID: " << app.getJobId()
                      << " | Title: " << jobTitle
                      << " | Proposed Price: $" << std::fixed << std::setprecision(2) << app.getProposedPrice()
                      << " | Application Status: " << app.getStatus()
                      << " | Job Status: " << jobStatus << "\n";
            count++;
        }
    }
    if (count == 0) {
        std::cout << "You have not applied to any jobs yet.\n";
    }
}

// ============================================================================
// ADMINISTRATOR WORKFLOWS
// ============================================================================
void Platform::viewAllUsers() const {
    std::cout << "\n-------------------- ALL REGISTERED USERS --------------------\n";
    std::cout << std::left << std::setw(6) << "ID"
              << std::setw(14) << "Role"
              << std::setw(22) << "Name"
              << std::setw(30) << "Email" << "\n";
    std::cout << std::string(72, '-') << "\n";

    for (const auto* user : users) {
        std::cout << std::left << std::setw(6) << user->getId()
                  << std::setw(14) << user->getRole()
                  << std::setw(22) << user->getName()
                  << std::setw(30) << user->getEmail() << "\n";
    }
}

void Platform::viewAllJobs() const {
    std::cout << "\n--------------------- ALL SYSTEM JOBS ---------------------\n";
    if (jobs.empty()) {
        std::cout << "No jobs exist in the system.\n";
        return;
    }
    for (const auto& job : jobs) {
        job.display();
    }
}

void Platform::viewAllApplications() const {
    std::cout << "\n------------------ ALL SYSTEM APPLICATIONS ------------------\n";
    if (applications.empty()) {
        std::cout << "No applications exist in the system.\n";
        return;
    }
    for (const auto& app : applications) {
        app.display();
    }
}

void Platform::removeUser(int adminId) {
    viewAllUsers();
    int targetId = getValidatedInt("Enter User ID to remove: ");

    if (targetId == adminId) {
        std::cout << "\n[ERROR] You cannot remove your own active administrator account.\n";
        return;
    }

    auto userIt = std::find_if(users.begin(), users.end(),
                               [targetId](User* u) { return u->getId() == targetId; });
    if (userIt == users.end()) {
        std::cout << "\n[ERROR] User with ID " << targetId << " not found.\n";
        return;
    }

    std::string removedName = (*userIt)->getName();
    std::string removedRole = (*userIt)->getRole();

    delete *userIt;
    users.erase(userIt);

    // Cascade cleanups
    if (removedRole == "Client") {
        // Remove jobs created by client and associated applications
        auto jobIt = jobs.begin();
        while (jobIt != jobs.end()) {
            if (jobIt->getClientId() == targetId) {
                int jId = jobIt->getId();
                // Remove applications for this job
                applications.erase(
                    std::remove_if(applications.begin(), applications.end(),
                                   [jId](const Application& a) { return a.getJobId() == jId; }),
                    applications.end()
                );
                jobIt = jobs.erase(jobIt);
            } else {
                ++jobIt;
            }
        }
    } else if (removedRole == "Freelancer") {
        // Remove applications submitted by freelancer
        applications.erase(
            std::remove_if(applications.begin(), applications.end(),
                           [targetId](const Application& a) { return a.getFreelancerId() == targetId; }),
            applications.end()
        );
        // Remove applicant ID from jobs
        for (auto& job : jobs) {
            auto& aIds = job.getApplicantIds();
            aIds.erase(std::remove(aIds.begin(), aIds.end(), targetId), aIds.end());
        }
    }

    saveData();
    std::cout << "\n[SUCCESS] Removed user \"" << removedName << "\" (ID: " << targetId << ").\n";
}

// ============================================================================
// ENTITY LOOKUPS
// ============================================================================
User* Platform::findUserById(int id) const {
    for (User* u : users) {
        if (u->getId() == id) return u;
    }
    return nullptr;
}

User* Platform::findUserByEmail(const std::string& email) const {
    std::string target = toLowerString(email);
    for (User* u : users) {
        if (toLowerString(u->getEmail()) == target) return u;
    }
    return nullptr;
}

Job* Platform::findJobById(int id) {
    for (auto& j : jobs) {
        if (j.getId() == id) return &j;
    }
    return nullptr;
}

const Job* Platform::findJobById(int id) const {
    for (const auto& j : jobs) {
        if (j.getId() == id) return &j;
    }
    return nullptr;
}

// ============================================================================
// PERSISTENCE ENGINE (Pipe-Delimited Flat Files)
// ============================================================================
void Platform::loadData() {
    // 1. Load Users
    std::ifstream userFile(usersFile);
    if (userFile.is_open()) {
        std::string line;
        while (std::getline(userFile, line)) {
            if (line.empty()) continue;
            auto parts = split(line, '|');
            if (parts.size() >= 5) {
                int id = std::stoi(parts[0]);
                std::string role = parts[1];
                std::string name = parts[2];
                std::string email = parts[3];
                std::string password = parts[4];

                // Requirement 2: Call factory method
                User* u = createUser(id, role, name, email, password);
                if (u != nullptr) {
                    users.push_back(u);
                    if (id >= nextUserId) nextUserId = id + 1;
                }
            }
        }
        userFile.close();
    }

    // 2. Load Jobs
    std::ifstream jFile(jobsFile);
    if (jFile.is_open()) {
        std::string line;
        while (std::getline(jFile, line)) {
            if (line.empty()) continue;
            auto parts = split(line, '|');
            if (parts.size() >= 6) {
                int id = std::stoi(parts[0]);
                std::string title = parts[1];
                std::string desc = parts[2];
                double budget = std::stod(parts[3]);
                std::string status = parts[4];
                int clientId = std::stoi(parts[5]);

                std::vector<int> applicants;
                if (parts.size() >= 7 && !parts[6].empty()) {
                    auto appTokens = split(parts[6], ',');
                    for (const auto& token : appTokens) {
                        if (!token.empty()) {
                            applicants.push_back(std::stoi(token));
                        }
                    }
                }

                jobs.emplace_back(id, title, desc, budget, status, clientId, applicants);
                if (id >= nextJobId) nextJobId = id + 1;
            }
        }
        jFile.close();
    }

    // 3. Load Applications
    std::ifstream appFile(applicationsFile);
    if (appFile.is_open()) {
        std::string line;
        while (std::getline(appFile, line)) {
            if (line.empty()) continue;
            auto parts = split(line, '|');
            if (parts.size() >= 4) {
                int jobId = std::stoi(parts[0]);
                int freelancerId = std::stoi(parts[1]);
                double price = std::stod(parts[2]);
                std::string status = parts[3];

                applications.emplace_back(jobId, freelancerId, price, status);
            }
        }
        appFile.close();
    }
}

void Platform::saveData() {
    // 1. Save Users
    std::ofstream userFile(usersFile);
    if (userFile.is_open()) {
        for (const auto* u : users) {
            userFile << u->getId() << "|"
                     << u->getRole() << "|"
                     << u->getName() << "|"
                     << u->getEmail() << "|"
                     << u->getPassword() << "\n";
        }
        userFile.close();
    }

    // 2. Save Jobs
    std::ofstream jFile(jobsFile);
    if (jFile.is_open()) {
        for (const auto& j : jobs) {
            jFile << j.getId() << "|"
                  << j.getTitle() << "|"
                  << j.getDescription() << "|"
                  << j.getBudget() << "|"
                  << j.getStatus() << "|"
                  << j.getClientId() << "|";

            const auto& aIds = j.getApplicantIds();
            for (size_t i = 0; i < aIds.size(); ++i) {
                jFile << aIds[i];
                if (i + 1 < aIds.size()) jFile << ",";
            }
            jFile << "\n";
        }
        jFile.close();
    }

    // 3. Save Applications
    std::ofstream appFile(applicationsFile);
    if (appFile.is_open()) {
        for (const auto& a : applications) {
            appFile << a.getJobId() << "|"
                    << a.getFreelancerId() << "|"
                    << a.getProposedPrice() << "|"
                    << a.getStatus() << "\n";
        }
        appFile.close();
    }
}

// ============================================================================
// INPUT VALIDATION HARDENING (Requirement 4)
// ============================================================================
int Platform::getValidatedInt(const std::string& prompt, int minVal, int maxVal) {
    int value;
    while (true) {
        std::cout << prompt;
        if (std::cin >> value) {
            if (value >= minVal && value <= maxVal) {
                std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
                return value;
            }
            std::cout << "[ERROR] Invalid selection. Please enter a value between "
                      << minVal << " and " << maxVal << ".\n";
        } else {
            std::cout << "[ERROR] Invalid input. Non-numeric characters detected. Please enter a number.\n";
            std::cin.clear();
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        }
    }
}

double Platform::getValidatedPositiveDouble(const std::string& prompt) {
    double value;
    while (true) {
        std::cout << prompt;
        if (std::cin >> value) {
            if (value > 0.0) {
                std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
                return value;
            }
            std::cout << "[ERROR] Value must be strictly positive (> $0.00). Please re-enter.\n";
        } else {
            std::cout << "[ERROR] Invalid numeric input. Please enter a valid decimal number.\n";
            std::cin.clear();
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        }
    }
}

std::string Platform::getValidatedLine(const std::string& prompt) {
    std::string line;
    while (true) {
        std::cout << prompt;
        std::getline(std::cin, line);
        // Trim leading and trailing spaces
        size_t first = line.find_first_not_of(" \t\r\n");
        if (first == std::string::npos) {
            std::cout << "[ERROR] Input cannot be blank. Please enter a valid value.\n";
            continue;
        }
        size_t last = line.find_last_not_of(" \t\r\n");
        return line.substr(first, last - first + 1);
    }
}
