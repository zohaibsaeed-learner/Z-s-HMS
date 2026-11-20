#ifndef FILEMANAGER_H
#define FILEMANAGER_H

#include "PatientList.h"
#include "AppointmentQueue.h"

class FileManager {
public:
    static bool savePatients(const PatientList& list);
    static bool saveAppointments(const AppointmentQueue& queue);
    static int loadPatients(PatientList& list);            // returns records loaded
    static int loadAppointments(AppointmentQueue& queue);  // returns records loaded
};

#endif