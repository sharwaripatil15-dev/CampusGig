#ifndef CAMPUSGIG_PLATFORM_H
#define CAMPUSGIG_PLATFORM_H

#include <iostream>
#include <string>
#include <vector>
#include <limits>
#include "User.h"
#include "Job.h"
#include "Application.h"

// Forward declaration of User subclasses
class Client;
class Freelancer;
class Admin;

/**
 * @class Platform
 * @brief Central controller managing users, jobs, applications, and system lifecycle.
 *
 * Handles user authentication, registration with college-domain verification,
 * dynamic object creation via Factory Method, marketplace interactions, input
 * hardening, and pipe-delimited flat-file persistence.
 */
class Platform {
private:
    std::vector<User*> users;
    std::vector<Job> jobs;
    std::vector<Application> applications;
    User* currentUser;
    int nextUserId;
    int nextJobId;

    // File persistence paths
    const std::string usersFile = "users.txt";
    const std::string jobsFile = "jobs.txt";
    const std::string applicationsFile = "applications.txt";

public:
    Platform();
    ~Platform();

    // Prevent copying to maintain single ownership of User* pointers
    Platform(const Platform&) = delete;
    Platform& operator=(const Platform&) = delete;

    // Core System Lifecycle
    void run();
    void registerUser();
    void loginUser();
    void logoutUser();

    // Factory Method for polymorphic User instantiation
    User* createUser(int id, const std::string& role, const std::string& name,
                     const std::string& email, const std::string& password);

    // Persistence Layer (pipe-delimited text files)
    void loadData();
    void saveData();

    // Client Workflows
    void postJob(int clientId);
    void viewClientJobs(int clientId) const;
    void viewApplicantsForJob(int clientId);
    void hireFreelancer(int clientId);
    void markJobComplete(int clientId);

    // Freelancer Workflows
    void browseOpenJobs() const;
    void searchJobsByKeyword() const;
    void applyForJob(int freelancerId);
    void viewFreelancerApplications(int freelancerId) const;

    // Administrator Workflows
    void viewAllUsers() const;
    void viewAllJobs() const;
    void viewAllApplications() const;
    void removeUser(int adminId);

    // Entity Lookups
    User* findUserById(int id) const;
    User* findUserByEmail(const std::string& email) const;
    Job* findJobById(int id);
    const Job* findJobById(int id) const;

    // Input Validation Hardening Helpers
    static int getValidatedInt(const std::string& prompt,
                               int minVal = std::numeric_limits<int>::min(),
                               int maxVal = std::numeric_limits<int>::max());
    static double getValidatedPositiveDouble(const std::string& prompt);
    static std::string getValidatedLine(const std::string& prompt);
};

#endif // CAMPUSGIG_PLATFORM_H
