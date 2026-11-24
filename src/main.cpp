#include <iostream>
#include <string>
#include <cstdlib>
#include "PatientList.h"
#include "AppointmentQueue.h"
#include "FileManager.h"

using namespace std;

static void saveAll();   // forward declaration (defined after the globals)

// ---------- Screen helpers ----------
static void clearScreen() {
#ifdef _WIN32
    system("cls");
#else
    system("clear");
#endif
}

// Hold the screen so the result of an action is actually read before the
// menu redraws. Waits for the user to press Enter.
static void pauseEnter() {
    cout << "\nPress Enter to continue...";
    string tmp;
    getline(cin, tmp);
}

// ---------- Input helpers ----------
static string trim(const string& s) {
    size_t a = s.find_first_not_of(" \t\r\n");
    if (a == string::npos) return "";
    size_t b = s.find_last_not_of(" \t\r\n");
    return s.substr(a, b - a + 1);
}

// '|' is our file separator, so it is not allowed inside text
static string readText(const string& prompt, bool allowBlank = false) {
    while (true) {
        cout << prompt;
        string s;
        if (!getline(cin, s)) {                 // Ctrl+Z / Ctrl+D / end of input
            cout << "\nInput ended. Saving and exiting...\n";
            saveAll();
            exit(0);
        }
        for (size_t i = 0; i < s.size(); i++)
            if (s[i] == '|') s[i] = ' ';
        s = trim(s);
        if (!s.empty() || allowBlank) return s;
        cout << "Input cannot be empty.\n";
    }
}

static bool tryParseInt(const string& s, int& out) {
    try {
        size_t pos;
        out = stoi(s, &pos);
        return pos == s.size();
    } catch (...) {
        return false;
    }
}

static int readInt(const string& prompt) {
    while (true) {
        string s = readText(prompt);
        int v;
        if (tryParseInt(s, v)) return v;
        cout << "Please enter a valid whole number.\n";
    }
}

static char readGender(const string& prompt) {
    string s = readText(prompt);
    return s.size() == 1 ? s[0] : '?';      // '?' fails validation
}

// Triage level for the emergency priority queue.
static Priority readPriority() {
    cout << "Priority:  1) Normal   2) Urgent   3) Critical (ICU)\n";
    int c = readInt("Choice [1-3]: ");
    if (c == 3) return CRITICAL;
    if (c == 2) return URGENT;
    return NORMAL;      // default / invalid -> Normal
}

// ---------- Globals ----------
static PatientList patients;
static AppointmentQueue appointments;

static void saveAll() {
    FileManager::savePatients(patients);
    FileManager::saveAppointments(appointments);
}

// ---------- Patient actions ----------
static void registerPatient() {
    cout << "\n--- Register Patient ---\n";
    int id = readInt("Patient ID: ");
    string name = readText("Name: ");
    int age = readInt("Age: ");
    char gender = readGender("Gender (M/F/O): ");
    string contact = readText("Contact (10-15 digits): ");
    string disease = readText("Disease/Diagnosis: ");
    if (patients.addPatient(id, name, age, gender, contact, disease))
        saveAll();
}

static void searchPatientById() {
    int id = readInt("Enter Patient ID: ");
    Patient* p = patients.searchById(id);
    if (p == nullptr) {
        cout << "Patient " << id << " not found.\n";
        return;
    }
    PatientList::printHeader();
    PatientList::printRow(p);
}

static void searchPatientByName() {
    string key = readText("Enter name (or part of it): ");
    int n = patients.searchByName(key);
    if (n == 0) cout << "No patients match \"" << key << "\".\n";
    else cout << n << " match(es) found.\n";
}

static void updatePatient() {
    cout << "\n--- Update Patient ---\n";
    int id = readInt("Patient ID to update: ");
    Patient* p = patients.searchById(id);
    if (p == nullptr) {
        cout << "Patient " << id << " not found.\n";
        return;
    }
    cout << "Current record:";
    PatientList::printHeader();
    PatientList::printRow(p);
    cout << "(Press Enter to keep the current value)\n";

    // Each field is validated on the spot and re-prompted if wrong, so one
    // bad entry never throws away the values already typed.
    string name = readText("New name: ", true);
    if (name.empty()) name = p->name;

    int age = p->age;
    while (true) {
        string s = readText("New age: ", true);
        if (s.empty()) break;                           // keep current
        int v;
        if (tryParseInt(s, v) && PatientList::validAge(v)) { age = v; break; }
        cout << "Age must be a whole number between 0 and 120. Try again.\n";
    }

    char gender = p->gender;
    while (true) {
        string s = readText("New gender (M/F/O): ", true);
        if (s.empty()) break;
        char g = (s.size() == 1) ? s[0] : '?';
        if (PatientList::validGender(g)) { gender = g; break; }
        cout << "Gender must be M, F or O. Try again.\n";
    }

    string contact = p->contact;
    while (true) {
        string s = readText("New contact: ", true);
        if (s.empty()) break;
        if (PatientList::validContact(s)) { contact = s; break; }
        cout << "Contact must be 10 to 15 digits. Try again.\n";
    }

    string disease = readText("New disease: ", true);
    if (disease.empty()) disease = p->disease;

    if (patients.updatePatient(id, name, age, gender, contact, disease))
        saveAll();
}

static void deletePatient() {
    int id = readInt("Patient ID to delete: ");
    if (!patients.exists(id)) {
        cout << "Error: Patient ID " << id << " not found.\n";
        return;
    }
    int cancelled = appointments.cancelAllForPatient(id);
    if (patients.deletePatient(id)) {
        cout << "Patient " << id << " deleted.\n";
        if (cancelled > 0)
            cout << cancelled << " scheduled appointment(s) of this patient were cancelled.\n";
        saveAll();
    }
}

static void sortPatientsMenu() {
    cout << "\nSort by:  1) ID   2) Name   3) Age\n";
    int c = readInt("Choice: ");
    if (c == 1) patients.sortById();
    else if (c == 2) patients.sortByName();
    else if (c == 3) patients.sortByAge();
    else { cout << "Invalid choice.\n"; return; }
    patients.displayAll();
    saveAll();      // list order is stored in the file as well
}

// ---------- Appointment actions ----------
static void bookAppointment() {
    cout << "\n--- Book Appointment ---\n";
    int pid = readInt("Patient ID: ");
    string date = readText("Date (DD-MM-YYYY): ");
    string time = readText("Time (HH:MM, 24h): ");
    string doctor = readText("Doctor name: ");
    Priority pr = readPriority();
    if (appointments.enqueue(pid, date, time, doctor, patients, pr))
        saveAll();
}

static void processNextAppointment() {
    if (appointments.processNext())
        saveAll();
}

static void cancelAppointment() {
    int id = readInt("Appointment ID to cancel: ");
    if (appointments.cancel(id))
        saveAll();
}

static void viewByStatusMenu() {
    cout << "\nStatus:  1) Scheduled   2) Completed   3) Cancelled\n";
    int c = readInt("Choice: ");
    if (c == 1) appointments.displayByStatus(SCHEDULED);
    else if (c == 2) appointments.displayByStatus(COMPLETED);
    else if (c == 3) appointments.displayByStatus(CANCELLED);
    else cout << "Invalid choice.\n";
}

// ---------- Menu ----------
static void showMenu() {
    cout << "\n=========== HOSPITAL MANAGEMENT SYSTEM ===========\n"
         << " PATIENTS\n"
         << "  1. Register patient          2. View all patients\n"
         << "  3. Search by ID              4. Search by name\n"
         << "  5. Update patient            6. Delete patient\n"
         << "  7. Sort patients\n"
         << " APPOINTMENTS\n"
         << "  8. Book appointment          9. Process next (priority)\n"
         << " 10. Cancel appointment       11. View all appointments\n"
         << " 12. View by status           13. View sorted by date/time\n"
         << " 14. View a patient's appointments\n"
         << " 15. View emergency queue (serving order)\n"
         << "  0. Save and exit\n"
         << "==================================================\n";
}

int main() {
    int np = FileManager::loadPatients(patients);
    int na = FileManager::loadAppointments(appointments);
    cout << "Loaded " << np << " patient(s) and " << na << " appointment(s) from file.\n";
    pauseEnter();

    int choice;
    do {
        clearScreen();
        showMenu();
        choice = readInt("Enter choice: ");
        switch (choice) {
            case 1:  registerPatient(); break;
            case 2:  patients.displayAll(); break;
            case 3:  searchPatientById(); break;
            case 4:  searchPatientByName(); break;
            case 5:  updatePatient(); break;
            case 6:  deletePatient(); break;
            case 7:  sortPatientsMenu(); break;
            case 8:  bookAppointment(); break;
            case 9:  processNextAppointment(); break;
            case 10: cancelAppointment(); break;
            case 11: appointments.displayAll(); break;
            case 12: viewByStatusMenu(); break;
            case 13: appointments.displaySortedByDateTime(); break;
            case 14: appointments.displayByPatient(readInt("Patient ID: ")); break;
            case 15: appointments.displayPriorityOrder(); break;
            case 0:  saveAll(); cout << "Data saved. Goodbye!\n"; break;
            default: cout << "Invalid choice. Please pick a number from the menu.\n";
        }
        if (choice != 0) pauseEnter();   // let the result stay on screen
    } while (choice != 0);

    return 0;
}