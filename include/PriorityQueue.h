#ifndef PRIORITYQUEUE_H
#define PRIORITYQUEUE_H

#include "Appointment.h"

// Binary MAX-HEAP of scheduled appointments.
//
// "Maximum" = most urgent. Ordering key, highest first:
//   1) priority level  (CRITICAL > URGENT > NORMAL)
//   2) if equal, smaller arrival id  (earlier booking served first = FIFO tie-break)
//
// The heap stores POINTERS to Appointment nodes that are owned by the
// AppointmentQueue's linked list, so it never allocates or frees them.
// Cancelled/completed/deleted appointments are handled by LAZY DELETION:
// they are simply skipped (and dropped) when they reach the top on pop().
class PriorityQueue {
private:
    Appointment** heap;     // dynamic array of pointers
    int capacity;
    int count;

    void grow();
    void siftUp(int i);
    void siftDown(int i);
    // true if a should come out before b (a is "greater" in the max-heap)
    static bool higher(const Appointment* a, const Appointment* b);
    static void swapAt(Appointment** h, int i, int j);

public:
    PriorityQueue();
    ~PriorityQueue();

    void push(Appointment* a);
    // Returns the most urgent SCHEDULED appointment and removes it.
    // Skips any entry that is no longer scheduled (lazy deletion).
    // Returns nullptr when nothing is waiting.
    Appointment* pop();
    // Same as pop() but without removing. nullptr if empty.
    Appointment* peek();

    void clear();
    int size() const;       // raw count (may include stale entries)
};

#endif
