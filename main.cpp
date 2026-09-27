#include "Platform.h"
#include <iostream>

/**
 * @file main.cpp
 * @brief Application entry point for CampusGig — A College Freelancing Platform.
 *
 * Part 1: C++17 Console Implementation
 * Initializes the central Platform engine, restores persistent state,
 * and enters the interactive event loop.
 */
int main() {
    try {
        Platform platform;
        platform.run();
    } catch (const std::exception& ex) {
        std::cerr << "\n[FATAL SYSTEM EXCEPTION] " << ex.what() << "\n";
        return 1;
    } catch (...) {
        std::cerr << "\n[FATAL SYSTEM ERROR] An unexpected exception occurred.\n";
        return 1;
    }

    return 0;
}
