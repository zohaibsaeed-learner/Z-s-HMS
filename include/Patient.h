#ifndef PATIENT_H
#define PATIENT_H

#include <string>

struct Patient {
    int id;
    std::string name;
    int age;
    char gender;            // 'M', 'F' or 'O'
    std::string contact;    // string, so leading zeros are kept
    std::string disease;
    Patient* next;

    Patient() : id(0), age(0), gender('M'), next(nullptr) {}
};

#endif