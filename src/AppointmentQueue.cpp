#include "AppointmentQueue.h"
#include <iostream>
#include <iomanip>
#include <vector>
#include <cctype>

using namespace std;

static string toLower(string s) {
    for (size_t i = 0; i < s.size(); i++)
        s[i] = (char)tolower((unsigned char)s[i]);
    return s;
}

static void printApptHeader() {
    cout << "\n" << left
         << setw(8)  << "Appt#"
         << setw(10) << "Patient"
         << setw(13) << "Date"
         << setw(8)  << "Time"
         << setw(18) << "Doctor"
         << setw(10) << "Priority"
         << setw(12) << "Status" << "\n";
    cout << string(79, '-') << "\n";
}

static void printApptRow(const Appointment* a) {
    cout << left
         << setw(8)  << a->id
         << setw(10) << a->patientId
         << setw(13) << a->date
         << setw(8)  << a->time
         << setw(18) << a->doctor
         << setw(10) << AppointmentQueue::priorityToString(a->priority)
         << setw(12) << AppointmentQueue::statusToString(a->status) << "\n";
}

AppointmentQueue::AppointmentQueue() : front(nullptr), rear(nullptr), nextId(1), total(0) {}

AppointmentQueue::~AppointmentQueue() {
    while (front != nullptr) {
        Appointment* temp = front;
        front = front->next;
        delete temp;
    }
}

// ---------- Validation ----------
bool AppointmentQueue::validDate(const string& d) {
    if (d.size() != 10 || d[2] != '-' || d[5] != '-') return false;
    for (int i = 0; i < 10; i++) {
        if (i == 2 || i == 5) continue;
        if (!isdigit((unsigned char)d[i])) return false;
    }
    int day = stoi(d.substr(0, 2));
    int month = stoi(d.substr(3, 2));
    int year = stoi(d.substr(6, 4));
    if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1) return false;
    int dm[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    bool leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
    if (leap) dm[1] = 29;
    return day <= dm[month - 1];
}

bool AppointmentQueue::validTime(const string& t) {
    if (t.size() != 5 || t[2] != ':') return false;
    for (int i = 0; i < 5; i++) {
        if (i == 2) continue;
        if (!isdigit((unsigned char)t[i])) return false;
    }
    int h = stoi(t.substr(0, 2));
    int m = stoi(t.substr(3, 2));
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

string AppointmentQueue::statusToString(ApptStatus s) {
    if (s == SCHEDULED) return "Scheduled";
    if (s == COMPLETED) return "Completed";
    return "Cancelled";
}

bool AppointmentQueue::stringToStatus(const string& str, ApptStatus& out) {
    if (str == "Scheduled") { out = SCHEDULED; return true; }
    if (str == "Completed") { out = COMPLETED; return true; }
    if (str == "Cancelled") { out = CANCELLED; return true; }
    return false;
}

string AppointmentQueue::priorityToString(Priority p) {
    if (p == CRITICAL) return "Critical";
    if (p == URGENT)   return "Urgent";
    return "Normal";
}

bool AppointmentQueue::stringToPriority(const string& str, Priority& out) {
    if (str == "Critical") { out = CRITICAL; return true; }
    if (str == "Urgent")   { out = URGENT;   return true; }
    if (str == "Normal")   { out = NORMAL;   return true; }
    return false;
}

// ---------- Helpers ----------
Appointment* AppointmentQueue::findById(int id) const {
    Appointment* cur = front;
    while (cur != nullptr) {
        if (cur->id == id) return cur;
        cur = cur->next;
    }
    return nullptr;
}

string AppointmentQueue::sortKey(const Appointment* a) {
    // DD-MM-YYYY + HH:MM  ->  YYYYMMDDHHMM (string comparison = chronological)
    return a->date.substr(6, 4) + a->date.substr(3, 2) + a->date.substr(0, 2) +
           a->time.substr(0, 2) + a->time.substr(3, 2);
}

// ---------- Queue operations ----------
bool AppointmentQueue::enqueue(int patientId, const string& date, const string& time,
                               const string& doctor, const PatientList& patients,
                               Priority priority) {
    if (!patients.exists(patientId)) {
        cout << "Error: Patient ID " << patientId << " does not exist. Register the patient first.\n";
        return false;
    }
    if (!validDate(date)) {
        cout << "Error: Invalid date. Use DD-MM-YYYY (a real calendar date, 2000-2100).\n";
        return false;
    }
    if (!validTime(time)) {
        cout << "Error: Invalid time. Use HH:MM in 24-hour format.\n";
        return false;
    }
    if (doctor.empty()) {
        cout << "Error: Doctor name cannot be empty.\n";
        return false;
    }
    // Same doctor cannot have two scheduled appointments at the same date and time
    Appointment* cur = front;
    while (cur != nullptr) {
        if (cur->status == SCHEDULED && cur->date == date && cur->time == time &&
            toLower(cur->doctor) == toLower(doctor)) {
            cout << "Error: Dr. " << doctor << " already has an appointment at "
                 << date << " " << time << ".\n";
            return false;
        }
        cur = cur->next;
    }

    Appointment* node = new Appointment();
    node->id = nextId++;
    node->patientId = patientId;
    node->date = date;
    node->time = time;
    node->doctor = doctor;
    node->status = SCHEDULED;
    node->priority = priority;
    node->next = nullptr;

    // Linked list keeps arrival order (the record of every booking).
    if (rear == nullptr) {
        front = rear = node;
    } else {
        rear->next = node;
        rear = node;
    }
    pq.push(node);          // heap decides the SERVING order
    total++;
    cout << "Appointment #" << node->id << " booked for patient " << patientId
         << " [" << priorityToString(priority) << "].\n";
    return true;
}

bool AppointmentQueue::processNext() {
    // The emergency priority queue decides who is seen next:
    // Critical before Urgent before Normal; equal levels in arrival order.
    Appointment* cur = pq.pop();
    if (cur == nullptr) {
        cout << "No scheduled appointments in the queue.\n";
        return false;
    }
    cur->status = COMPLETED;
    cout << "Processed appointment #" << cur->id << " (Patient " << cur->patientId
         << ", Dr. " << cur->doctor << ", " << cur->date << " " << cur->time
         << ", " << priorityToString(cur->priority) << ") -> Completed.\n";
    return true;
}

bool AppointmentQueue::cancel(int apptId) {
    Appointment* a = findById(apptId);
    if (a == nullptr) {
        cout << "Error: Appointment #" << apptId << " does not exist.\n";
        return false;
    }
    if (a->status != SCHEDULED) {
        cout << "Error: Appointment #" << apptId << " is already "
             << statusToString(a->status) << " and cannot be cancelled.\n";
        return false;
    }
    a->status = CANCELLED;      // heap skips it lazily when it reaches the top
    cout << "Appointment #" << apptId << " cancelled.\n";
    return true;
}

int AppointmentQueue::cancelAllForPatient(int patientId) {
    int n = 0;
    Appointment* cur = front;
    while (cur != nullptr) {
        if (cur->patientId == patientId && cur->status == SCHEDULED) {
            cur->status = CANCELLED;
            n++;
        }
        cur = cur->next;
    }
    return n;
}

void AppointmentQueue::addLoaded(int id, int patientId, const string& date,
                                 const string& time, const string& doctor,
                                 ApptStatus status, Priority priority) {
    Appointment* node = new Appointment();
    node->id = id;
    node->patientId = patientId;
    node->date = date;
    node->time = time;
    node->doctor = doctor;
    node->status = status;
    node->priority = priority;
    node->next = nullptr;
    if (rear == nullptr) {
        front = rear = node;
    } else {
        rear->next = node;
        rear = node;
    }
    if (status == SCHEDULED) pq.push(node);   // rebuild the heap from saved data
    total++;
    if (id >= nextId) nextId = id + 1;
}

// ---------- Display ----------
void AppointmentQueue::displayAll() const {
    if (front == nullptr) {
        cout << "No appointments found.\n";
        return;
    }
    printApptHeader();
    Appointment* cur = front;
    while (cur != nullptr) {
        printApptRow(cur);
        cur = cur->next;
    }
    cout << "Total appointments: " << total << " (Scheduled: " << pendingCount() << ")\n";
}

void AppointmentQueue::displayByStatus(ApptStatus s) const {
    int found = 0;
    Appointment* cur = front;
    while (cur != nullptr) {
        if (cur->status == s) {
            if (found == 0) printApptHeader();
            printApptRow(cur);
            found++;
        }
        cur = cur->next;
    }
    if (found == 0)
        cout << "No " << statusToString(s) << " appointments.\n";
}

void AppointmentQueue::displayByPatient(int patientId) const {
    int found = 0;
    Appointment* cur = front;
    while (cur != nullptr) {
        if (cur->patientId == patientId) {
            if (found == 0) printApptHeader();
            printApptRow(cur);
            found++;
        }
        cur = cur->next;
    }
    if (found == 0)
        cout << "No appointments found for patient " << patientId << ".\n";
}

// Insertion sort on a COPY of the pointers, so queue (arrival) order is untouched
void AppointmentQueue::displaySortedByDateTime() const {
    if (front == nullptr) {
        cout << "No appointments found.\n";
        return;
    }
    vector<Appointment*> arr;
    for (Appointment* cur = front; cur != nullptr; cur = cur->next)
        arr.push_back(cur);

    for (size_t i = 1; i < arr.size(); i++) {
        Appointment* key = arr[i];
        string keyStr = sortKey(key);
        int j = (int)i - 1;
        while (j >= 0 && sortKey(arr[j]) > keyStr) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }

    printApptHeader();
    for (size_t i = 0; i < arr.size(); i++)
        printApptRow(arr[i]);
}

// Shows the exact order the emergency priority queue would serve patients,
// without disturbing the real queue (uses a temporary heap).
void AppointmentQueue::displayPriorityOrder() {
    PriorityQueue temp;
    for (Appointment* cur = front; cur != nullptr; cur = cur->next)
        if (cur->status == SCHEDULED) temp.push(cur);

    if (temp.peek() == nullptr) {
        cout << "No scheduled appointments waiting.\n";
        return;
    }
    cout << "\nEmergency queue - order in which patients will be served:\n";
    printApptHeader();
    int pos = 1;
    Appointment* a;
    while ((a = temp.pop()) != nullptr) {
        cout << setw(3) << pos++ << ") ";
        printApptRow(a);
    }
}

int AppointmentQueue::pendingCount() const {
    int n = 0;
    for (Appointment* cur = front; cur != nullptr; cur = cur->next)
        if (cur->status == SCHEDULED) n++;
    return n;
}

bool AppointmentQueue::isEmpty() const { return pendingCount() == 0; }
Appointment* AppointmentQueue::getFront() const { return front; }
