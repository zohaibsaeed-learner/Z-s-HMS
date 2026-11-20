#include "httplib.h"
#include <iostream>
#include <sstream>
#include <mutex>
#include "PatientList.h"
#include "AppointmentQueue.h"
#include "FileManager.h"

using namespace std;

static PatientList patients;
static AppointmentQueue appointments;
static mutex mtx;   // one request at a time, the lists are not thread-safe

// ---------- helpers ----------
static string esc(const string& s) {
    string o;
    for (size_t i = 0; i < s.size(); i++) {
        char c = s[i];
        if (c == '"') o += "\\\"";
        else if (c == '\\') o += "\\\\";
        else if ((unsigned char)c < 0x20) o += ' ';
        else o += c;
    }
    return o;
}

static int toInt(const string& s) {
    try {
        size_t p;
        int v = stoi(s, &p);
        return p == s.size() ? v : -1;
    } catch (...) { return -1; }
}

// '|' is our file separator, so strip it, then trim
static string clean(string s) {
    for (size_t i = 0; i < s.size(); i++) if (s[i] == '|') s[i] = ' ';
    size_t a = s.find_first_not_of(" \t\r\n");
    if (a == string::npos) return "";
    size_t b = s.find_last_not_of(" \t\r\n");
    return s.substr(a, b - a + 1);
}

static char gender(const httplib::Request& req) {
    string g = clean(req.get_param_value("gender"));
    return g.size() == 1 ? g[0] : '?';
}

// Runs fn while capturing everything it prints to cout
template <typename F>
static string capture(F fn, bool& ok) {
    ostringstream buf;
    streambuf* old = cout.rdbuf(buf.rdbuf());
    ok = fn();
    cout.rdbuf(old);
    string s = buf.str();
    while (!s.empty() && (s[s.size() - 1] == '\n' || s[s.size() - 1] == '\r'))
        s.erase(s.size() - 1);
    return s;
}

static void reply(httplib::Response& res, bool ok, const string& msg) {
    res.status = ok ? 200 : 400;
    res.set_content("{\"ok\":" + string(ok ? "true" : "false") +
                    ",\"message\":\"" + esc(msg) + "\"}", "application/json");
}

static void saveAll() {
    FileManager::savePatients(patients);
    FileManager::saveAppointments(appointments);
}

static string patientsJson() {
    string j = "[";
    for (Patient* p = patients.getHead(); p != nullptr; p = p->next) {
        if (p != patients.getHead()) j += ",";
        j += "{\"id\":" + to_string(p->id) + ",\"name\":\"" + esc(p->name) +
             "\",\"age\":" + to_string(p->age) + ",\"gender\":\"" + string(1, p->gender) +
             "\",\"contact\":\"" + esc(p->contact) + "\",\"disease\":\"" + esc(p->disease) + "\"}";
    }
    return j + "]";
}

static string appointmentsJson() {
    string j = "[";
    for (Appointment* a = appointments.getFront(); a != nullptr; a = a->next) {
        if (a != appointments.getFront()) j += ",";
        j += "{\"id\":" + to_string(a->id) + ",\"patientId\":" + to_string(a->patientId) +
             ",\"date\":\"" + a->date + "\",\"time\":\"" + a->time +
             "\",\"doctor\":\"" + esc(a->doctor) + "\",\"status\":\"" +
             AppointmentQueue::statusToString(a->status) + "\"}";
    }
    return j + "]";
}

int main() {
    int np = FileManager::loadPatients(patients);
    int na = FileManager::loadAppointments(appointments);
    cout << "Loaded " << np << " patient(s) and " << na << " appointment(s).\n";

    httplib::Server svr;

    // ----- Patients -----
    svr.Get("/api/patients", [](const httplib::Request&, httplib::Response& res) {
        lock_guard<mutex> lk(mtx);
        res.set_content(patientsJson(), "application/json");
    });

    svr.Post("/api/patients", [](const httplib::Request& req, httplib::Response& res) {
        lock_guard<mutex> lk(mtx);
        bool ok;
        string msg = capture([&] {
            return patients.addPatient(toInt(req.get_param_value("id")),
                clean(req.get_param_value("name")), toInt(req.get_param_value("age")),
                gender(req), clean(req.get_param_value("contact")),
                clean(req.get_param_value("disease")));
        }, ok);
        if (ok) saveAll();
        reply(res, ok, msg);
    });

    svr.Post("/api/patients/update", [](const httplib::Request& req, httplib::Response& res) {
        lock_guard<mutex> lk(mtx);
        bool ok;
        string msg = capture([&] {
            return patients.updatePatient(toInt(req.get_param_value("id")),
                clean(req.get_param_value("name")), toInt(req.get_param_value("age")),
                gender(req), clean(req.get_param_value("contact")),
                clean(req.get_param_value("disease")));
        }, ok);
        if (ok) saveAll();
        reply(res, ok, msg);
    });

    svr.Post("/api/patients/delete", [](const httplib::Request& req, httplib::Response& res) {
        lock_guard<mutex> lk(mtx);
        int id = toInt(req.get_param_value("id"));
        bool ok;
        int cancelled = 0;
        string msg = capture([&] {
            if (!patients.exists(id)) {
                cout << "Error: Patient ID " << id << " not found.";
                return false;
            }
            cancelled = appointments.cancelAllForPatient(id);
            return patients.deletePatient(id);
        }, ok);
        if (ok) {
            msg = "Patient " + to_string(id) + " deleted.";
            if (cancelled > 0) msg += " " + to_string(cancelled) + " scheduled appointment(s) cancelled.";
            saveAll();
        }
        reply(res, ok, msg);
    });

    svr.Post("/api/patients/sort", [](const httplib::Request& req, httplib::Response& res) {
        lock_guard<mutex> lk(mtx);
        string by = req.get_param_value("by");
        if (by == "id") patients.sortById();
        else if (by == "name") patients.sortByName();
        else if (by == "age") patients.sortByAge();
        else { reply(res, false, "Sort by must be id, name or age."); return; }
        saveAll();
        reply(res, true, "Sorted by " + by + ".");
    });

    // ----- Appointments -----
    svr.Get("/api/appointments", [](const httplib::Request&, httplib::Response& res) {
        lock_guard<mutex> lk(mtx);
        res.set_content(appointmentsJson(), "application/json");
    });

    svr.Post("/api/appointments", [](const httplib::Request& req, httplib::Response& res) {
        lock_guard<mutex> lk(mtx);
        bool ok;
        string msg = capture([&] {
            return appointments.enqueue(toInt(req.get_param_value("patientId")),
                clean(req.get_param_value("date")), clean(req.get_param_value("time")),
                clean(req.get_param_value("doctor")), patients);
        }, ok);
        if (ok) saveAll();
        reply(res, ok, msg);
    });

    svr.Post("/api/appointments/process", [](const httplib::Request&, httplib::Response& res) {
        lock_guard<mutex> lk(mtx);
        bool ok;
        string msg = capture([&] { return appointments.processNext(); }, ok);
        if (ok) saveAll();
        reply(res, ok, msg);
    });

    svr.Post("/api/appointments/cancel", [](const httplib::Request& req, httplib::Response& res) {
        lock_guard<mutex> lk(mtx);
        bool ok;
        string msg = capture([&] { return appointments.cancel(toInt(req.get_param_value("id"))); }, ok);
        if (ok) saveAll();
        reply(res, ok, msg);
    });

    cout << "Server running on http://localhost:8080\n";
    svr.listen("127.0.0.1", 8080);
    return 0;
}