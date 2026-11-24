#ifndef APPOINTMENT_H
#define APPOINTMENT_H

#include <string>

enum ApptStatus { SCHEDULED, COMPLETED, CANCELLED };

// Triage level. CRITICAL is served first, then URGENT, then NORMAL.
// Within the same level, appointments are served in arrival order (FIFO).
enum Priority { NORMAL, URGENT, CRITICAL };

struct Appointment {
    int id;
    int patientId;
    std::string date;       // DD-MM-YYYY
    std::string time;       // HH:MM (24h)
    std::string doctor;
    ApptStatus status;
    Priority priority;      // triage level for the emergency priority queue
    Appointment* next;

    Appointment()
        : id(0), patientId(0), status(SCHEDULED), priority(NORMAL), next(nullptr) {}
};

#endif
