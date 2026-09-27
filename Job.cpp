#include "Job.h"
#include <iostream>
#include <iomanip>
#include <algorithm>

Job::Job(int id, const std::string& title, const std::string& description,
         double budget, const std::string& status, int clientId,
         const std::vector<int>& applicantIds)
    : id(id), title(title), description(description),
      budget(budget), status(status), clientId(clientId), applicantIds(applicantIds) {}

void Job::display() const {
    std::cout << "\n+-------------------------------------------------------------+\n";
    std::cout << "| Job ID      : " << std::left << std::setw(44) << id << "|\n";
    std::cout << "| Title       : " << std::left << std::setw(44) << title << "|\n";
    std::cout << "| Status      : " << std::left << std::setw(44) << status << "|\n";
    std::cout << "| Budget      : $" << std::fixed << std::setprecision(2)
              << std::left << std::setw(43) << budget << "|\n";
    std::cout << "| Client ID   : " << std::left << std::setw(44) << clientId << "|\n";
    std::cout << "| Applicants  : " << std::left << std::setw(44) << applicantIds.size() << "|\n";
    std::cout << "| Description : " << std::left << std::setw(44)
              << (description.length() > 44 ? description.substr(0, 41) + "..." : description) << "|\n";
    std::cout << "+-------------------------------------------------------------+\n";
}

void Job::addApplicant(int freelancerId) {
    if (!hasApplicant(freelancerId)) {
        applicantIds.push_back(freelancerId);
    }
}

bool Job::hasApplicant(int freelancerId) const {
    return std::find(applicantIds.begin(), applicantIds.end(), freelancerId) != applicantIds.end();
}
