#ifndef CAMPUSGIG_JOB_H
#define CAMPUSGIG_JOB_H

#include <string>
#include <vector>

/**
 * @class Job
 * @brief Represents a freelancing project posted by a client in the campus marketplace.
 *
 * Encapsulates job details, budget, lifecycle status (Open/InProgress/Completed),
 * client ownership, and applicant tracking.
 */
class Job {
private:
    int id;
    std::string title;
    std::string description;
    double budget;
    std::string status; // "Open", "InProgress", "Completed"
    int clientId;
    std::vector<int> applicantIds;

public:
    Job(int id, const std::string& title, const std::string& description,
        double budget, const std::string& status, int clientId,
        const std::vector<int>& applicantIds = {});

    // Marketplace Actions
    void display() const;
    void addApplicant(int freelancerId);
    bool hasApplicant(int freelancerId) const;

    // Getters
    int getId() const { return id; }
    const std::string& getTitle() const { return title; }
    const std::string& getDescription() const { return description; }
    double getBudget() const { return budget; }
    const std::string& getStatus() const { return status; }
    int getClientId() const { return clientId; }
    const std::vector<int>& getApplicantIds() const { return applicantIds; }
    std::vector<int>& getApplicantIds() { return applicantIds; }

    // Setters
    void setTitle(const std::string& newTitle) { title = newTitle; }
    void setDescription(const std::string& newDesc) { description = newDesc; }
    void setBudget(double newBudget) { budget = newBudget; }
    void setStatus(const std::string& newStatus) { status = newStatus; }
};

#endif // CAMPUSGIG_JOB_H
