#include "Application.h"
#include <iostream>
#include <iomanip>

Application::Application(int jobId, int freelancerId, double proposedPrice, const std::string& status)
    : jobId(jobId), freelancerId(freelancerId), proposedPrice(proposedPrice), status(status) {}

void Application::display() const {
    std::cout << "[Application] Job ID: " << std::left << std::setw(5) << jobId
              << " | Freelancer ID: " << std::left << std::setw(5) << freelancerId
              << " | Proposed Price: $" << std::fixed << std::setprecision(2) << std::setw(8) << proposedPrice
              << " | Status: " << status << "\n";
}
