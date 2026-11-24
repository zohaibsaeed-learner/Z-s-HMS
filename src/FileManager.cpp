#include "FileManager.h"
#include <fstream>
#include <sstream>
#include <vector>
#include <iostream>

#ifndef DATA_DIR
#define DATA_DIR "data/"
#endif

using namespace std;

static const string PATIENT_FILE = string(DATA_DIR) + "patients.txt";
static const string APPT_FILE    = string(DATA_DIR) + "appointments.txt";

static vector<string> split(const string& line, char delim) {
    vector<string> parts;
    string item;
    stringstream ss(line);
    while (getline(ss, item, delim))
        parts.push_back(item);
    return parts;
}

bool FileManager::savePatients(const PatientList& list) {
    ofstream out(PATIENT_FILE.c_str());
    if (!out) {
        cout << "Error: could not write to " << PATIENT_FILE << "\n";
        return false;
    }
    for (Patient* p = list.getHead(); p != nullptr; p = p->next) {
        out << p->id << '|' << p->name << '|' << p->age << '|' << p->gender << '|'
            << p->contact << '|' << p->disease << '\n';
    }
    return true;
}

bool FileManager::saveAppointments(const AppointmentQueue& queue) {
    ofstream out(APPT_FILE.c_str());
    if (!out) {
        cout << "Error: could not write to " << APPT_FILE << "\n";
        return false;
    }
    for (Appointment* a = queue.getFront(); a != nullptr; a = a->next) {
        out << a->id << '|' << a->patientId << '|' << a->date << '|' << a->time << '|'
            << a->doctor << '|' << AppointmentQueue::statusToString(a->status) << '|'
            << AppointmentQueue::priorityToString(a->priority) << '\n';
    }
    return true;
}

int FileManager::loadPatients(PatientList& list) {
    ifstream in(PATIENT_FILE.c_str());
    if (!in) return 0;               // first run: no file yet

    int loaded = 0;
    string line;
    while (getline(in, line)) {
        if (!line.empty() && line[line.size() - 1] == '\r') line.erase(line.size() - 1);
        if (line.empty()) continue;

        vector<string> f = split(line, '|');
        if (f.size() != 6 || f[3].size() != 1) {
            cout << "Warning: skipped corrupt patient line: " << line << "\n";
            continue;
        }
        try {
            int id = stoi(f[0]);
            int age = stoi(f[2]);
            if (list.addPatient(id, f[1], age, f[3][0], f[4], f[5], true)) loaded++;
            else cout << "Warning: skipped invalid patient line: " << line << "\n";
        } catch (...) {
            cout << "Warning: skipped corrupt patient line: " << line << "\n";
        }
    }
    return loaded;
}

int FileManager::loadAppointments(AppointmentQueue& queue) {
    ifstream in(APPT_FILE.c_str());
    if (!in) return 0;

    int loaded = 0;
    string line;
    while (getline(in, line)) {
        if (!line.empty() && line[line.size() - 1] == '\r') line.erase(line.size() - 1);
        if (line.empty()) continue;

        vector<string> f = split(line, '|');
        ApptStatus status;
        // 6 fields = old file (no priority) -> default Normal. 7 fields = new file.
        if ((f.size() != 6 && f.size() != 7) ||
            !AppointmentQueue::stringToStatus(f[5], status) ||
            !AppointmentQueue::validDate(f[2]) || !AppointmentQueue::validTime(f[3])) {
            cout << "Warning: skipped corrupt appointment line: " << line << "\n";
            continue;
        }
        Priority priority = NORMAL;
        if (f.size() == 7 && !AppointmentQueue::stringToPriority(f[6], priority))
            priority = NORMAL;      // unknown label falls back to Normal
        try {
            int id = stoi(f[0]);
            int pid = stoi(f[1]);
            queue.addLoaded(id, pid, f[2], f[3], f[4], status, priority);
            loaded++;
        } catch (...) {
            cout << "Warning: skipped corrupt appointment line: " << line << "\n";
        }
    }
    return loaded;
}