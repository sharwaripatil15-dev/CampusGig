#include "User.h"
#include "Platform.h"
#include <iostream>
#include <iomanip>

// ============================================================================
// BASE USER IMPLEMENTATION
// ============================================================================
User::User(int id, const std::string& name, const std::string& email,
           const std::string& password, const std::string& role)
    : id(id), name(name), email(email), password(password), role(role) {}

// ============================================================================
// CLIENT IMPLEMENTATION
// ============================================================================
Client::Client(int id, const std::string& name, const std::string& email, const std::string& password)
    : User(id, name, email, password, "Client") {}

void Client::displayInfo() const {
    std::cout << "\n[CLIENT PROFILE]\n";
    std::cout << "User ID : " << id << "\n";
    std::cout << "Name    : " << name << "\n";
    std::cout << "Email   : " << email << "\n";
    std::cout << "Role    : " << role << "\n";
}

void Client::displayMenu(Platform& platform) {
    bool active = true;
    while (active) {
        std::cout << "\n======================================================\n";
        std::cout << "           CLIENT DASHBOARD - " << name << "\n";
        std::cout << "======================================================\n";
        std::cout << "1. Post a New Job\n";
        std::cout << "2. View My Posted Jobs\n";
        std::cout << "3. View Applicants for a Job\n";
        std::cout << "4. Hire a Freelancer\n";
        std::cout << "5. Mark Job as Completed\n";
        std::cout << "6. View Profile Details\n";
        std::cout << "7. Logout\n";
        std::cout << "------------------------------------------------------\n";

        int choice = Platform::getValidatedInt("Enter choice (1-7): ", 1, 7);
        switch (choice) {
            case 1:
                platform.postJob(id);
                break;
            case 2:
                platform.viewClientJobs(id);
                break;
            case 3:
                platform.viewApplicantsForJob(id);
                break;
            case 4:
                platform.hireFreelancer(id);
                break;
            case 5:
                platform.markJobComplete(id);
                break;
            case 6:
                displayInfo();
                break;
            case 7:
                std::cout << "\nLogging out from Client Dashboard...\n";
                active = false;
                break;
            default:
                break;
        }
    }
}

// ============================================================================
// FREELANCER IMPLEMENTATION
// ============================================================================
Freelancer::Freelancer(int id, const std::string& name, const std::string& email, const std::string& password)
    : User(id, name, email, password, "Freelancer") {}

void Freelancer::displayInfo() const {
    std::cout << "\n[FREELANCER PROFILE - VERIFIED STUDENT]\n";
    std::cout << "User ID : " << id << "\n";
    std::cout << "Name    : " << name << "\n";
    std::cout << "Email   : " << email << " (Verified College Student)\n";
    std::cout << "Role    : " << role << "\n";
}

void Freelancer::displayMenu(Platform& platform) {
    bool active = true;
    while (active) {
        std::cout << "\n======================================================\n";
        std::cout << "         FREELANCER DASHBOARD - " << name << "\n";
        std::cout << "======================================================\n";
        std::cout << "1. Browse All Open Jobs\n";
        std::cout << "2. Search Jobs by Keyword\n"; // Requirement 3
        std::cout << "3. Apply for a Job\n";
        std::cout << "4. View My Applications & Status\n";
        std::cout << "5. View Profile Details\n";
        std::cout << "6. Logout\n";
        std::cout << "------------------------------------------------------\n";

        int choice = Platform::getValidatedInt("Enter choice (1-6): ", 1, 6);
        switch (choice) {
            case 1:
                platform.browseOpenJobs();
                break;
            case 2:
                // Requirement 3: Keyword Search
                platform.searchJobsByKeyword();
                break;
            case 3:
                platform.applyForJob(id);
                break;
            case 4:
                platform.viewFreelancerApplications(id);
                break;
            case 5:
                displayInfo();
                break;
            case 6:
                std::cout << "\nLogging out from Freelancer Dashboard...\n";
                active = false;
                break;
            default:
                break;
        }
    }
}

// ============================================================================
// ADMIN IMPLEMENTATION
// ============================================================================
Admin::Admin(int id, const std::string& name, const std::string& email, const std::string& password)
    : User(id, name, email, password, "Admin") {}

void Admin::displayInfo() const {
    std::cout << "\n[ADMINISTRATOR PROFILE]\n";
    std::cout << "User ID : " << id << "\n";
    std::cout << "Name    : " << name << "\n";
    std::cout << "Email   : " << email << "\n";
    std::cout << "Role    : " << role << "\n";
}

void Admin::displayMenu(Platform& platform) {
    bool active = true;
    while (active) {
        std::cout << "\n======================================================\n";
        std::cout << "          ADMINISTRATOR CONTROL CONSOLE               \n";
        std::cout << "======================================================\n";
        std::cout << "1. View All Registered Users\n";
        std::cout << "2. View All System Jobs\n";
        std::cout << "3. View All System Applications\n";
        std::cout << "4. Remove a User\n";
        std::cout << "5. View Profile Details\n";
        std::cout << "6. Logout\n";
        std::cout << "------------------------------------------------------\n";

        int choice = Platform::getValidatedInt("Enter choice (1-6): ", 1, 6);
        switch (choice) {
            case 1:
                platform.viewAllUsers();
                break;
            case 2:
                platform.viewAllJobs();
                break;
            case 3:
                platform.viewAllApplications();
                break;
            case 4:
                platform.removeUser(id);
                break;
            case 5:
                displayInfo();
                break;
            case 6:
                std::cout << "\nLogging out from Administrator Console...\n";
                active = false;
                break;
            default:
                break;
        }
    }
}
