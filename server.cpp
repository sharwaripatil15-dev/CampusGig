#include "include/crow_all.h"
#include "Platform.h"
#include "User.h"
#include "Job.h"
#include "Application.h"

#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <mutex>
#include <random>
#include <sstream>
#include <iomanip>
#include <chrono>

// ============================================================================
// SESSION MANAGEMENT & SECURITY
// ============================================================================

struct Session {
    int userId;
    std::string role;
    std::string email;
    std::chrono::system_clock::time_point createdAt;
};

class SessionManager {
private:
    std::unordered_map<std::string, Session> sessions;
    std::mutex mtx;

    std::string generateHexToken() {
        static std::random_device rd;
        static std::mt19937_64 gen(rd());
        static std::uniform_int_distribution<uint64_t> dis;

        std::stringstream ss;
        ss << "cg_" << std::hex << dis(gen) << dis(gen);
        return ss.str();
    }

public:
    std::string createSession(const User& user) {
        std::lock_guard<std::mutex> lock(mtx);
        std::string token = generateHexToken();
        sessions[token] = {user.getId(), user.getRole(), user.getEmail(), std::chrono::system_clock::now()};
        return token;
    }

    bool validateToken(const std::string& token, Session& outSession) {
        std::lock_guard<std::mutex> lock(mtx);
        auto it = sessions.find(token);
        if (it != sessions.end()) {
            outSession = it->second;
            return true;
        }
        return false;
    }

    void removeSession(const std::string& token) {
        std::lock_guard<std::mutex> lock(mtx);
        sessions.erase(token);
    }
};

// ============================================================================
// HTTP / JSON HELPERS
// ============================================================================

static crow::response jsonResponse(int code, const crow::json::wvalue& val) {
    crow::response res(code, val.dump());
    res.set_header("Content-Type", "application/json");
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Token");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS, PUT");
    return res;
}

static crow::response errorResponse(int code, const std::string& message) {
    crow::json::wvalue val;
    val["success"] = false;
    val["error"] = message;
    return jsonResponse(code, val);
}

static std::string extractToken(const crow::request& req) {
    std::string auth = req.get_header_value("Authorization");
    if (!auth.empty()) {
        const std::string prefix = "Bearer ";
        if (auth.rfind(prefix, 0) == 0) {
            return auth.substr(prefix.length());
        }
        return auth;
    }
    std::string custom = req.get_header_value("X-Session-Token");
    if (!custom.empty()) return custom;
    return "";
}

// ============================================================================
// MAIN SERVER ENTRY POINT
// ============================================================================

int main(int argc, char* argv[]) {
    int port = 8080;
    if (argc > 1) {
        try {
            port = std::stoi(argv[1]);
        } catch (...) {
            std::cerr << "Invalid port argument. Using default: 8080\n";
        }
    }

    Platform platform;
    std::mutex platformMutex;
    SessionManager sessionManager;

    crow::App<crow::CORSHandler> app;

    auto& cors = app.get_middleware<crow::CORSHandler>();
    cors.global()
        .origin("*")
        .methods(crow::HTTPMethod::Get, crow::HTTPMethod::Post,
                 crow::HTTPMethod::Delete, crow::HTTPMethod::Options,
                 crow::HTTPMethod::Put)
        .headers("Content-Type", "Authorization", "X-Session-Token");

    // Preflight handler fallback
    CROW_ROUTE(app, "/<path>")
    .methods(crow::HTTPMethod::Options)([](const crow::request&, crow::response& res, std::string) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Token");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS, PUT");
        res.code = 204;
        res.end();
    });

    CROW_ROUTE(app, "/api/<path>")
    .methods(crow::HTTPMethod::Options)([](const crow::request&, crow::response& res, std::string) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Token");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS, PUT");
        res.code = 204;
        res.end();
    });

    // Root status endpoint
    CROW_ROUTE(app, "/")([]() {
        crow::json::wvalue res;
        res["service"] = "CampusGig REST API Server";
        res["status"] = "online";
        res["version"] = "2.0";
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // 1. POST /api/register — { name, email, password, role }
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/register").methods(crow::HTTPMethod::Post)([&platform, &platformMutex, &sessionManager](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body) {
            return errorResponse(400, "Invalid JSON payload in request body.");
        }

        if (!body.has("name") || !body.has("email") || !body.has("password") || !body.has("role")) {
            return errorResponse(400, "Missing required fields: name, email, password, and role.");
        }

        std::string name = body["name"].s();
        std::string email = body["email"].s();
        std::string password = body["password"].s();
        std::string role = body["role"].s();

        std::string err;
        User* user = nullptr;
        {
            std::lock_guard<std::mutex> lock(platformMutex);
            user = platform.registerUserApi(name, email, password, role, err);
        }

        if (!user) {
            return errorResponse(400, err);
        }

        std::string token = sessionManager.createSession(*user);

        crow::json::wvalue res;
        res["success"] = true;
        res["message"] = "Registered successfully as " + role + "!";
        res["token"] = token;
        res["user"]["id"] = user->getId();
        res["user"]["name"] = user->getName();
        res["user"]["email"] = user->getEmail();
        res["user"]["role"] = user->getRole();
        return jsonResponse(201, res);
    });

    // ------------------------------------------------------------------------
    // 2. POST /api/login — { email, password }
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/login").methods(crow::HTTPMethod::Post)([&platform, &platformMutex, &sessionManager](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body) {
            return errorResponse(400, "Invalid JSON payload in request body.");
        }

        if (!body.has("email") || !body.has("password")) {
            return errorResponse(400, "Missing required fields: email and password.");
        }

        std::string email = body["email"].s();
        std::string password = body["password"].s();

        std::string err;
        User* user = nullptr;
        {
            std::lock_guard<std::mutex> lock(platformMutex);
            user = platform.loginUserApi(email, password, err);
        }

        if (!user) {
            return errorResponse(401, err);
        }

        std::string token = sessionManager.createSession(*user);

        crow::json::wvalue res;
        res["success"] = true;
        res["message"] = "Login successful! Welcome back, " + user->getName() + ".";
        res["token"] = token;
        res["user"]["id"] = user->getId();
        res["user"]["name"] = user->getName();
        res["user"]["email"] = user->getEmail();
        res["user"]["role"] = user->getRole();
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // POST /api/logout
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/logout").methods(crow::HTTPMethod::Post)([&sessionManager](const crow::request& req) {
        std::string token = extractToken(req);
        if (!token.empty()) {
            sessionManager.removeSession(token);
        }
        crow::json::wvalue res;
        res["success"] = true;
        res["message"] = "Logged out successfully.";
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // GET /api/auth/me — returns current authenticated user info
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/auth/me").methods(crow::HTTPMethod::Get)([&platform, &platformMutex, &sessionManager](const crow::request& req) {
        std::string token = extractToken(req);
        Session sess;
        if (!sessionManager.validateToken(token, sess)) {
            return errorResponse(401, "Unauthorized or session expired. Please log in again.");
        }

        std::lock_guard<std::mutex> lock(platformMutex);
        User* user = platform.findUserById(sess.userId);
        if (!user) {
            return errorResponse(401, "User record not found.");
        }

        crow::json::wvalue res;
        res["success"] = true;
        res["user"]["id"] = user->getId();
        res["user"]["name"] = user->getName();
        res["user"]["email"] = user->getEmail();
        res["user"]["role"] = user->getRole();
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // GET /api/users/:id — Get user profile with live statistics
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/users/<int>").methods(crow::HTTPMethod::Get)([&platform, &platformMutex](const crow::request&, int userId) {
        std::lock_guard<std::mutex> lock(platformMutex);
        User* user = platform.findUserById(userId);
        if (!user) {
            return errorResponse(404, "User profile not found.");
        }

        int totalApps = 0;
        int acceptedGigs = 0;
        int completedGigs = 0;
        double totalEarnings = 0.0;

        for (const auto& app : platform.getApplications()) {
            if (app.getFreelancerId() == userId) {
                totalApps++;
                if (app.getStatus() == "Accepted") {
                    acceptedGigs++;
                    const Job* j = platform.findJobById(app.getJobId());
                    if (j && j->getStatus() == "Completed") {
                        completedGigs++;
                        totalEarnings += app.getProposedPrice();
                    } else if (j && j->getStatus() == "InProgress") {
                        totalEarnings += app.getProposedPrice();
                    }
                }
            }
        }

        crow::json::wvalue res;
        res["success"] = true;
        res["user"]["id"] = user->getId();
        res["user"]["name"] = user->getName();
        res["user"]["email"] = user->getEmail();
        res["user"]["role"] = user->getRole();
        res["user"]["isVerifiedStudent"] = (user->getRole() == "Freelancer" && Platform::isCollegeEmail(user->getEmail()));
        res["user"]["institution"] = Platform::isCollegeEmail(user->getEmail()) ? "Vellore Institute of Technology" : "External";
        res["user"]["stats"]["totalApplications"] = totalApps;
        res["user"]["stats"]["acceptedGigs"] = acceptedGigs;
        res["user"]["stats"]["completedGigs"] = completedGigs;
        res["user"]["stats"]["totalEarnings"] = totalEarnings;
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // POST /api/profile/update — Update user profile (name, password)
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/profile/update").methods(crow::HTTPMethod::Post)([&platform, &platformMutex, &sessionManager](const crow::request& req) {
        std::string token = extractToken(req);
        Session sess;
        if (!sessionManager.validateToken(token, sess)) {
            return errorResponse(401, "Unauthorized: Authentication required.");
        }

        auto body = crow::json::load(req.body);
        if (!body) {
            return errorResponse(400, "Invalid JSON payload in request body.");
        }

        std::lock_guard<std::mutex> lock(platformMutex);
        User* user = platform.findUserById(sess.userId);
        if (!user) {
            return errorResponse(404, "User record not found.");
        }

        if (body.has("name")) {
            std::string newName = body["name"].s();
            if (!newName.empty()) {
                user->setName(newName);
            }
        }

        if (body.has("password")) {
            std::string newPass = body["password"].s();
            if (!newPass.empty()) {
                user->setPassword(newPass);
            }
        }

        platform.saveData();

        crow::json::wvalue res;
        res["success"] = true;
        res["message"] = "Profile updated successfully!";
        res["user"]["id"] = user->getId();
        res["user"]["name"] = user->getName();
        res["user"]["email"] = user->getEmail();
        res["user"]["role"] = user->getRole();
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // 3. GET /api/jobs — list open jobs (supports optional ?search=keyword)
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/jobs").methods(crow::HTTPMethod::Get)([&platform, &platformMutex](const crow::request& req) {
        std::string search = "";
        char* searchParam = req.url_params.get("search");
        if (searchParam) {
            search = searchParam;
        }

        std::vector<Job> matchingJobs;
        std::lock_guard<std::mutex> lock(platformMutex);
        matchingJobs = platform.searchJobsApi(search);

        std::vector<crow::json::wvalue> jobList;
        for (const auto& job : matchingJobs) {
            crow::json::wvalue item;
            item["id"] = job.getId();
            item["title"] = job.getTitle();
            item["description"] = job.getDescription();
            item["budget"] = job.getBudget();
            item["status"] = job.getStatus();
            item["clientId"] = job.getClientId();

            User* clientUser = platform.findUserById(job.getClientId());
            item["clientName"] = clientUser ? clientUser->getName() : "Unknown Client";
            item["applicantCount"] = static_cast<int>(job.getApplicantIds().size());

            jobList.push_back(std::move(item));
        }

        crow::json::wvalue res;
        res = std::move(jobList);
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // 4. POST /api/jobs — create a job (Client only)
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/jobs").methods(crow::HTTPMethod::Post)([&platform, &platformMutex, &sessionManager](const crow::request& req) {
        std::string token = extractToken(req);
        Session sess;
        if (!sessionManager.validateToken(token, sess)) {
            return errorResponse(401, "Unauthorized: Authentication token required.");
        }
        if (sess.role != "Client") {
            return errorResponse(403, "Forbidden: Only clients can post jobs.");
        }

        auto body = crow::json::load(req.body);
        if (!body) {
            return errorResponse(400, "Invalid JSON payload in request body.");
        }

        if (!body.has("title") || !body.has("description") || !body.has("budget")) {
            return errorResponse(400, "Missing required fields: title, description, and budget.");
        }

        std::string title = body["title"].s();
        std::string description = body["description"].s();
        double budget = 0.0;
        if (body["budget"].t() == crow::json::type::Number) {
            budget = body["budget"].d();
        } else {
            return errorResponse(400, "Budget must be a numeric value.");
        }

        std::string err;
        Job* newJob = nullptr;
        {
            std::lock_guard<std::mutex> lock(platformMutex);
            newJob = platform.postJobApi(sess.userId, title, description, budget, err);
        }

        if (!newJob) {
            return errorResponse(400, err);
        }

        crow::json::wvalue res;
        res["success"] = true;
        res["message"] = "Job posted successfully!";
        res["job"]["id"] = newJob->getId();
        res["job"]["title"] = newJob->getTitle();
        res["job"]["description"] = newJob->getDescription();
        res["job"]["budget"] = newJob->getBudget();
        res["job"]["status"] = newJob->getStatus();
        res["job"]["clientId"] = newJob->getClientId();
        res["job"]["applicantCount"] = 0;
        return jsonResponse(201, res);
    });

    // ------------------------------------------------------------------------
    // GET /api/client/jobs — view all jobs posted by the authenticated client
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/client/jobs").methods(crow::HTTPMethod::Get)([&platform, &platformMutex, &sessionManager](const crow::request& req) {
        std::string token = extractToken(req);
        Session sess;
        if (!sessionManager.validateToken(token, sess)) {
            return errorResponse(401, "Unauthorized: Authentication token required.");
        }
        if (sess.role != "Client") {
            return errorResponse(403, "Forbidden: Only clients can view posted jobs.");
        }

        std::lock_guard<std::mutex> lock(platformMutex);
        std::vector<crow::json::wvalue> clientJobs;
        for (const auto& job : platform.getJobs()) {
            if (job.getClientId() == sess.userId) {
                crow::json::wvalue item;
                item["id"] = job.getId();
                item["title"] = job.getTitle();
                item["description"] = job.getDescription();
                item["budget"] = job.getBudget();
                item["status"] = job.getStatus();
                item["clientId"] = job.getClientId();
                item["applicantCount"] = static_cast<int>(job.getApplicantIds().size());

                clientJobs.push_back(std::move(item));
            }
        }

        crow::json::wvalue res;
        res = std::move(clientJobs);
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // 5. GET /api/jobs/:id/applicants — view applicants for a job (Client only)
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/jobs/<int>/applicants").methods(crow::HTTPMethod::Get)([&platform, &platformMutex, &sessionManager](const crow::request& req, int jobId) {
        std::string token = extractToken(req);
        Session sess;
        if (!sessionManager.validateToken(token, sess)) {
            return errorResponse(401, "Unauthorized: Authentication token required.");
        }
        if (sess.role != "Client") {
            return errorResponse(403, "Forbidden: Only clients can view job applicants.");
        }

        std::lock_guard<std::mutex> lock(platformMutex);
        Job* job = platform.findJobById(jobId);
        if (!job || job->getClientId() != sess.userId) {
            return errorResponse(403, "Job not found or you do not have permission to view it.");
        }

        std::vector<crow::json::wvalue> applicantList;
        for (const auto& app : platform.getApplications()) {
            if (app.getJobId() == jobId) {
                crow::json::wvalue item;
                item["jobId"] = app.getJobId();
                item["freelancerId"] = app.getFreelancerId();
                item["proposedPrice"] = app.getProposedPrice();
                item["status"] = app.getStatus();

                User* f = platform.findUserById(app.getFreelancerId());
                item["freelancerName"] = f ? f->getName() : "Unknown Freelancer";
                item["freelancerEmail"] = f ? f->getEmail() : "Unknown Email";

                applicantList.push_back(std::move(item));
            }
        }

        crow::json::wvalue res;
        res = std::move(applicantList);
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // 6. POST /api/jobs/:id/apply — Freelancer applies: { proposedPrice }
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/jobs/<int>/apply").methods(crow::HTTPMethod::Post)([&platform, &platformMutex, &sessionManager](const crow::request& req, int jobId) {
        std::string token = extractToken(req);
        Session sess;
        if (!sessionManager.validateToken(token, sess)) {
            return errorResponse(401, "Unauthorized: Authentication token required.");
        }
        if (sess.role != "Freelancer") {
            return errorResponse(403, "Forbidden: Only verified freelancers can apply for jobs.");
        }

        auto body = crow::json::load(req.body);
        if (!body) {
            return errorResponse(400, "Invalid JSON payload in request body.");
        }

        if (!body.has("proposedPrice")) {
            return errorResponse(400, "Missing required field: proposedPrice.");
        }

        double proposedPrice = 0.0;
        if (body["proposedPrice"].t() == crow::json::type::Number) {
            proposedPrice = body["proposedPrice"].d();
        } else {
            return errorResponse(400, "proposedPrice must be a valid numeric value.");
        }

        std::string err;
        bool ok = false;
        {
            std::lock_guard<std::mutex> lock(platformMutex);
            ok = platform.applyForJobApi(sess.userId, jobId, proposedPrice, err);
        }

        if (!ok) {
            return errorResponse(400, err);
        }

        crow::json::wvalue res;
        res["success"] = true;
        res["message"] = "Application submitted successfully for Job #" + std::to_string(jobId) + "!";
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // 7. POST /api/jobs/:id/hire — Client hires a freelancer: { freelancerId }
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/jobs/<int>/hire").methods(crow::HTTPMethod::Post)([&platform, &platformMutex, &sessionManager](const crow::request& req, int jobId) {
        std::string token = extractToken(req);
        Session sess;
        if (!sessionManager.validateToken(token, sess)) {
            return errorResponse(401, "Unauthorized: Authentication token required.");
        }
        if (sess.role != "Client") {
            return errorResponse(403, "Forbidden: Only clients can hire freelancers.");
        }

        auto body = crow::json::load(req.body);
        if (!body) {
            return errorResponse(400, "Invalid JSON payload in request body.");
        }

        if (!body.has("freelancerId")) {
            return errorResponse(400, "Missing required field: freelancerId.");
        }

        int freelancerId = body["freelancerId"].i();

        std::string err;
        bool ok = false;
        {
            std::lock_guard<std::mutex> lock(platformMutex);
            ok = platform.hireFreelancerApi(sess.userId, jobId, freelancerId, err);
        }

        if (!ok) {
            return errorResponse(400, err);
        }

        crow::json::wvalue res;
        res["success"] = true;
        res["message"] = "Freelancer #" + std::to_string(freelancerId) + " hired! Job status updated to InProgress.";
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // 8. POST /api/jobs/:id/complete — Client marks job completed
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/jobs/<int>/complete").methods(crow::HTTPMethod::Post)([&platform, &platformMutex, &sessionManager](const crow::request& req, int jobId) {
        std::string token = extractToken(req);
        Session sess;
        if (!sessionManager.validateToken(token, sess)) {
            return errorResponse(401, "Unauthorized: Authentication token required.");
        }
        if (sess.role != "Client") {
            return errorResponse(403, "Forbidden: Only clients can complete jobs.");
        }

        std::string err;
        bool ok = false;
        {
            std::lock_guard<std::mutex> lock(platformMutex);
            ok = platform.markJobCompleteApi(sess.userId, jobId, err);
        }

        if (!ok) {
            return errorResponse(400, err);
        }

        crow::json::wvalue res;
        res["success"] = true;
        res["message"] = "Job #" + std::to_string(jobId) + " marked as Completed! Thank you for using CampusGig.";
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // 9. GET /api/applications/me — Freelancer's own applications
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/applications/me").methods(crow::HTTPMethod::Get)([&platform, &platformMutex, &sessionManager](const crow::request& req) {
        std::string token = extractToken(req);
        Session sess;
        if (!sessionManager.validateToken(token, sess)) {
            return errorResponse(401, "Unauthorized: Authentication token required.");
        }
        if (sess.role != "Freelancer") {
            return errorResponse(403, "Forbidden: Only freelancers can view their applications.");
        }

        std::lock_guard<std::mutex> lock(platformMutex);
        std::vector<crow::json::wvalue> myApps;
        for (const auto& app : platform.getApplications()) {
            if (app.getFreelancerId() == sess.userId) {
                crow::json::wvalue item;
                item["jobId"] = app.getJobId();
                item["freelancerId"] = app.getFreelancerId();
                item["proposedPrice"] = app.getProposedPrice();
                item["status"] = app.getStatus();

                const Job* job = platform.findJobById(app.getJobId());
                if (job) {
                    item["jobTitle"] = job->getTitle();
                    item["jobStatus"] = job->getStatus();
                    item["jobBudget"] = job->getBudget();
                    item["clientId"] = job->getClientId();

                    User* clientUser = platform.findUserById(job->getClientId());
                    item["clientName"] = clientUser ? clientUser->getName() : "Unknown Client";
                } else {
                    item["jobTitle"] = "Removed Job";
                    item["jobStatus"] = "Unknown";
                    item["jobBudget"] = 0.0;
                    item["clientId"] = 0;
                    item["clientName"] = "Unknown";
                }

                myApps.push_back(std::move(item));
            }
        }

        crow::json::wvalue res;
        res = std::move(myApps);
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // 10. GET /api/admin/users — Admin only, list all users
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/admin/users").methods(crow::HTTPMethod::Get)([&platform, &platformMutex, &sessionManager](const crow::request& req) {
        std::string token = extractToken(req);
        Session sess;
        if (!sessionManager.validateToken(token, sess)) {
            return errorResponse(401, "Unauthorized: Authentication token required.");
        }
        if (sess.role != "Admin") {
            return errorResponse(403, "Forbidden: Administrator privileges required.");
        }

        std::lock_guard<std::mutex> lock(platformMutex);
        std::vector<crow::json::wvalue> userList;
        for (const auto* user : platform.getUsers()) {
            crow::json::wvalue item;
            item["id"] = user->getId();
            item["name"] = user->getName();
            item["email"] = user->getEmail();
            item["role"] = user->getRole();
            userList.push_back(std::move(item));
        }

        crow::json::wvalue res;
        res = std::move(userList);
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // 11. DELETE /api/admin/users/:id — Admin only, remove a user
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/admin/users/<int>").methods(crow::HTTPMethod::Delete)([&platform, &platformMutex, &sessionManager](const crow::request& req, int targetUserId) {
        std::string token = extractToken(req);
        Session sess;
        if (!sessionManager.validateToken(token, sess)) {
            return errorResponse(401, "Unauthorized: Authentication token required.");
        }
        if (sess.role != "Admin") {
            return errorResponse(403, "Forbidden: Administrator privileges required.");
        }

        std::string err;
        bool ok = false;
        {
            std::lock_guard<std::mutex> lock(platformMutex);
            ok = platform.removeUserApi(sess.userId, targetUserId, err);
        }

        if (!ok) {
            return errorResponse(400, err);
        }

        crow::json::wvalue res;
        res["success"] = true;
        res["message"] = "Removed user with ID " + std::to_string(targetUserId) + " successfully.";
        return jsonResponse(200, res);
    });

    // ------------------------------------------------------------------------
    // GET /api/admin/jobs — Admin only, list all system jobs
    // ------------------------------------------------------------------------
    CROW_ROUTE(app, "/api/admin/jobs").methods(crow::HTTPMethod::Get)([&platform, &platformMutex, &sessionManager](const crow::request& req) {
        std::string token = extractToken(req);
        Session sess;
        if (!sessionManager.validateToken(token, sess)) {
            return errorResponse(401, "Unauthorized: Authentication token required.");
        }
        if (sess.role != "Admin") {
            return errorResponse(403, "Forbidden: Administrator privileges required.");
        }

        std::lock_guard<std::mutex> lock(platformMutex);
        std::vector<crow::json::wvalue> jobList;
        for (const auto& job : platform.getJobs()) {
            crow::json::wvalue item;
            item["id"] = job.getId();
            item["title"] = job.getTitle();
            item["description"] = job.getDescription();
            item["budget"] = job.getBudget();
            item["status"] = job.getStatus();
            item["clientId"] = job.getClientId();

            User* clientUser = platform.findUserById(job.getClientId());
            item["clientName"] = clientUser ? clientUser->getName() : "Unknown";
            item["applicantCount"] = static_cast<int>(job.getApplicantIds().size());

            jobList.push_back(std::move(item));
        }

        crow::json::wvalue res;
        res = std::move(jobList);
        return jsonResponse(200, res);
    });

    std::cout << "========================================================\n";
    std::cout << "  CAMPUSGIG REST API SERVER STARTED ON PORT " << port << "\n";
    std::cout << "  Base URL: http://localhost:" << port << "\n";
    std::cout << "  CORS enabled for frontend clients\n";
    std::cout << "========================================================\n";

    app.port(port).multithreaded().run();

    return 0;
}
