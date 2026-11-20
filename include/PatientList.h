#ifndef PATIENTLIST_H
#define PATIENTLIST_H

#include "Patient.h"
#include <string>

class PatientList {
private:
    Patient* head;
    int count;

    void bubbleSort(int mode);                               // 0=id, 1=name, 2=age
    static bool outOfOrder(const Patient* a, const Patient* b, int mode);
    static void swapData(Patient* a, Patient* b);

public:
    PatientList();
    ~PatientList();

    // Validation helpers
    static bool validAge(int age);
    static bool validGender(char g);
    static bool validContact(const std::string& c);

    // CRUD
    bool addPatient(int id, const std::string& name, int age, char gender,
                    const std::string& contact, const std::string& disease,
                    bool quiet = false);
    bool updatePatient(int id, const std::string& name, int age, char gender,
                       const std::string& contact, const std::string& disease);
    bool deletePatient(int id);

    // Searching
    bool exists(int id) const;
    Patient* searchById(int id) const;
    int searchByName(const std::string& part) const;   // returns number of matches

    // Sorting
    void sortById();
    void sortByName();
    void sortByAge();

    // Display
    void displayAll() const;
    static void printHeader();
    static void printRow(const Patient* p);

    int size() const;
    Patient* getHead() const;
};

#endif