#ifndef APPOINTMENT_H
#define APPOINTMENT_H

#include <string>

enum ApptStatus { SCHEDULED, COMPLETED, CANCELLED };

struct Appointment {
    int id;
    int patientId;
    std::string date;       // DD-MM-YYYY
    std::string time;       // HH:MM (24h)
    std::string doctor;
    ApptStatus status;
    Appointment* next;

    Appointment() : id(0), patientId(0), status(SCHEDULED), next(nullptr) {}
};

#endif