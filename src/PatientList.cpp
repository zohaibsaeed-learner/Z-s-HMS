#include "PatientList.h"
#include <iostream>
#include <iomanip>
#include <cctype>

using namespace std;

static string toLower(string s) {
    for (size_t i = 0; i < s.size(); i++)
        s[i] = (char)tolower((unsigned char)s[i]);
    return s;
}

PatientList::PatientList() : head(nullptr), count(0) {}

PatientList::~PatientList() {
    while (head != nullptr) {
        Patient* temp = head;
        head = head->next;
        delete temp;
    }
}

// ---------- Validation ----------
bool PatientList::validAge(int age) { return age >= 0 && age <= 120; }

bool PatientList::validGender(char g) {
    g = (char)toupper((unsigned char)g);
    return g == 'M' || g == 'F' || g == 'O';
}

bool PatientList::validContact(const string& c) {
    if (c.size() < 10 || c.size() > 15) return false;
    for (size_t i = 0; i < c.size(); i++)
        if (!isdigit((unsigned char)c[i])) return false;
    return true;
}

// ---------- CRUD ----------
bool PatientList::addPatient(int id, const string& name, int age, char gender,
                             const string& contact, const string& disease, bool quiet) {
    if (id <= 0) {
        if (!quiet) cout << "Error: Patient ID must be a positive number.\n";
        return false;
    }
    if (exists(id)) {
        if (!quiet) cout << "Error: Patient ID " << id << " already exists (duplicate ID).\n";
        return false;
    }
    if (name.empty()) {
        if (!quiet) cout << "Error: Name cannot be empty.\n";
        return false;
    }
    if (!validAge(age)) {
        if (!quiet) cout << "Error: Age must be between 0 and 120.\n";
        return false;
    }
    if (!validGender(gender)) {
        if (!quiet) cout << "Error: Gender must be M, F or O.\n";
        return false;
    }
    if (!validContact(contact)) {
        if (!quiet) cout << "Error: Contact must be 10 to 15 digits.\n";
        return false;
    }
    if (disease.empty()) {
        if (!quiet) cout << "Error: Disease/diagnosis cannot be empty.\n";
        return false;
    }

    Patient* node = new Patient();
    node->id = id;
    node->name = name;
    node->age = age;
    node->gender = (char)toupper((unsigned char)gender);
    node->contact = contact;
    node->disease = disease;
    node->next = nullptr;

    // Insert at the tail so registration order is preserved
    if (head == nullptr) {
        head = node;
    } else {
        Patient* cur = head;
        while (cur->next != nullptr) cur = cur->next;
        cur->next = node;
    }
    count++;
    if (!quiet) cout << "Patient " << id << " registered successfully.\n";
    return true;
}

bool PatientList::updatePatient(int id, const string& name, int age, char gender,
                                const string& contact, const string& disease) {
    Patient* p = searchById(id);
    if (p == nullptr) {
        cout << "Error: Patient ID " << id << " not found.\n";
        return false;
    }
    if (name.empty()) { cout << "Error: Name cannot be empty.\n"; return false; }
    if (!validAge(age)) { cout << "Error: Age must be between 0 and 120.\n"; return false; }
    if (!validGender(gender)) { cout << "Error: Gender must be M, F or O.\n"; return false; }
    if (!validContact(contact)) { cout << "Error: Contact must be 10 to 15 digits.\n"; return false; }
    if (disease.empty()) { cout << "Error: Disease/diagnosis cannot be empty.\n"; return false; }

    p->name = name;
    p->age = age;
    p->gender = (char)toupper((unsigned char)gender);
    p->contact = contact;
    p->disease = disease;
    cout << "Patient " << id << " updated successfully.\n";
    return true;
}

bool PatientList::deletePatient(int id) {
    if (head == nullptr) {
        cout << "Error: No patients in the system.\n";
        return false;
    }
    if (head->id == id) {
        Patient* temp = head;
        head = head->next;
        delete temp;
        count--;
        return true;
    }
    Patient* cur = head;
    while (cur->next != nullptr && cur->next->id != id)
        cur = cur->next;
    if (cur->next == nullptr) {
        cout << "Error: Patient ID " << id << " not found.\n";
        return false;
    }
    Patient* temp = cur->next;
    cur->next = temp->next;
    delete temp;
    count--;
    return true;
}

// ---------- Searching ----------
bool PatientList::exists(int id) const { return searchById(id) != nullptr; }

Patient* PatientList::searchById(int id) const {
    Patient* cur = head;
    while (cur != nullptr) {
        if (cur->id == id) return cur;
        cur = cur->next;
    }
    return nullptr;
}

int PatientList::searchByName(const string& part) const {
    string key = toLower(part);
    int found = 0;
    Patient* cur = head;
    while (cur != nullptr) {
        if (toLower(cur->name).find(key) != string::npos) {
            if (found == 0) printHeader();
            printRow(cur);
            found++;
        }
        cur = cur->next;
    }
    return found;
}

// ---------- Sorting (bubble sort, swaps data not pointers) ----------
bool PatientList::outOfOrder(const Patient* a, const Patient* b, int mode) {
    if (mode == 0) return a->id > b->id;
    if (mode == 1) return toLower(a->name) > toLower(b->name);
    return a->age > b->age;
}

void PatientList::swapData(Patient* a, Patient* b) {
    swap(a->id, b->id);
    swap(a->name, b->name);
    swap(a->age, b->age);
    swap(a->gender, b->gender);
    swap(a->contact, b->contact);
    swap(a->disease, b->disease);
}

void PatientList::bubbleSort(int mode) {
    if (head == nullptr || head->next == nullptr) return;   // empty or single
    bool swapped;
    Patient* last = nullptr;
    do {
        swapped = false;
        Patient* cur = head;
        while (cur->next != last) {
            if (outOfOrder(cur, cur->next, mode)) {
                swapData(cur, cur->next);
                swapped = true;
            }
            cur = cur->next;
        }
        last = cur;
    } while (swapped);
}

void PatientList::sortById()   { bubbleSort(0); }
void PatientList::sortByName() { bubbleSort(1); }
void PatientList::sortByAge()  { bubbleSort(2); }

// ---------- Display ----------
void PatientList::printHeader() {
    cout << "\n" << left
         << setw(8)  << "ID"
         << setw(22) << "Name"
         << setw(6)  << "Age"
         << setw(8)  << "Gender"
         << setw(17) << "Contact"
         << setw(20) << "Disease" << "\n";
    cout << string(81, '-') << "\n";
}

void PatientList::printRow(const Patient* p) {
    cout << left
         << setw(8)  << p->id
         << setw(22) << p->name
         << setw(6)  << p->age
         << setw(8)  << p->gender
         << setw(17) << p->contact
         << setw(20) << p->disease << "\n";
}

void PatientList::displayAll() const {
    if (head == nullptr) {
        cout << "No patient records found.\n";
        return;
    }
    printHeader();
    Patient* cur = head;
    while (cur != nullptr) {
        printRow(cur);
        cur = cur->next;
    }
    cout << "Total patients: " << count << "\n";
}

int PatientList::size() const { return count; }
Patient* PatientList::getHead() const { return head; }