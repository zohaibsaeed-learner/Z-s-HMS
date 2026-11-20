#ifndef APPOINTMENTQUEUE_H
#define APPOINTMENTQUEUE_H

#include "Appointment.h"
#include "PatientList.h"
#include <string>

class AppointmentQueue {
private:
    Appointment* front;
    Appointment* rear;
    int nextId;
    int total;

    Appointment* findById(int id) const;
    static std::string sortKey(const Appointment* a);

public:
    AppointmentQueue();
    ~AppointmentQueue();

    // Validation helpers
    static bool validDate(const std::string& d);
    static bool validTime(const std::string& t);

    static std::string statusToString(ApptStatus s);
    static bool stringToStatus(const std::string& str, ApptStatus& out);

    // Queue operations
    bool enqueue(int patientId, const std::string& date, const std::string& time,
                 const std::string& doctor, const PatientList& patients);
    bool processNext();
    bool cancel(int apptId);
    int cancelAllForPatient(int patientId);

    // File loading (no validation output, keeps stored id and status)
    void addLoaded(int id, int patientId, const std::string& date,
                   const std::string& time, const std::string& doctor, ApptStatus status);

    // Display / search / sort
    void displayAll() const;
    void displayByStatus(ApptStatus s) const;
    void displayByPatient(int patientId) const;
    void displaySortedByDateTime() const;

    int pendingCount() const;
    bool isEmpty() const;            // true if no SCHEDULED appointments
    Appointment* getFront() const;
};

#endif