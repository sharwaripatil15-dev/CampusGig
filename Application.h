#ifndef CAMPUSGIG_APPLICATION_H
#define CAMPUSGIG_APPLICATION_H

#include <string>

/**
 * @class Application
 * @brief Represents a proposal submitted by a student freelancer for a posted job.
 *
 * Encapsulates the job ID reference, freelancer ID reference, proposed price,
 * and review status (Pending, Accepted, Rejected).
 */
class Application {
private:
    int jobId;
    int freelancerId;
    double proposedPrice;
    std::string status; // "Pending", "Accepted", "Rejected"

public:
    Application(int jobId, int freelancerId, double proposedPrice,
                const std::string& status = "Pending");

    // Display
    void display() const;

    // Getters
    int getJobId() const { return jobId; }
    int getFreelancerId() const { return freelancerId; }
    double getProposedPrice() const { return proposedPrice; }
    const std::string& getStatus() const { return status; }

    // Setters
    void setProposedPrice(double newPrice) { proposedPrice = newPrice; }
    void setStatus(const std::string& newStatus) { status = newStatus; }
};

#endif // CAMPUSGIG_APPLICATION_H
