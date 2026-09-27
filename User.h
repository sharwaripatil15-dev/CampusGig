#ifndef CAMPUSGIG_USER_H
#define CAMPUSGIG_USER_H

#include <string>
#include <iostream>

// Forward declaration of Platform to break circular dependencies
class Platform;

/**
 * @class User
 * @brief Abstract base class defining the common identity and interface for all system actors.
 *
 * Demonstrates Abstraction and Inheritance. Enforces pure virtual displayMenu()
 * and displayInfo() methods across all derived roles.
 */
class User {
protected:
    int id;
    std::string name;
    std::string email;
    std::string password;
    std::string role;

public:
    User(int id, const std::string& name, const std::string& email,
         const std::string& password, const std::string& role);
    virtual ~User() = default;

    // Pure virtual methods enforcing runtime polymorphism
    virtual void displayMenu(Platform& platform) = 0;
    virtual void displayInfo() const = 0;

    // Getters (Encapsulation)
    int getId() const { return id; }
    const std::string& getName() const { return name; }
    const std::string& getEmail() const { return email; }
    const std::string& getPassword() const { return password; }
    const std::string& getRole() const { return role; }

    // Setters
    void setName(const std::string& newName) { name = newName; }
    void setEmail(const std::string& newEmail) { email = newEmail; }
    void setPassword(const std::string& newPass) { password = newPass; }
};

/**
 * @class Client
 * @brief Represents clients who post jobs, view applicants, and hire freelancers.
 */
class Client : public User {
public:
    Client(int id, const std::string& name, const std::string& email, const std::string& password);
    void displayMenu(Platform& platform) override;
    void displayInfo() const override;
};

/**
 * @class Freelancer
 * @brief Represents authenticated college student freelancers who browse and apply for jobs.
 */
class Freelancer : public User {
public:
    Freelancer(int id, const std::string& name, const std::string& email, const std::string& password);
    void displayMenu(Platform& platform) override;
    void displayInfo() const override;
};

/**
 * @class Admin
 * @brief Represents system administrators who manage users, inspect marketplace jobs, and moderate.
 */
class Admin : public User {
public:
    Admin(int id, const std::string& name, const std::string& email, const std::string& password);
    void displayMenu(Platform& platform) override;
    void displayInfo() const override;
};

#endif // CAMPUSGIG_USER_H
