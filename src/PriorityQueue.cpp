#include "PriorityQueue.h"

PriorityQueue::PriorityQueue() : heap(nullptr), capacity(0), count(0) {}

PriorityQueue::~PriorityQueue() {
    delete[] heap;          // only the pointer array is ours, not the nodes
}

void PriorityQueue::grow() {
    int newCap = (capacity == 0) ? 8 : capacity * 2;
    Appointment** bigger = new Appointment*[newCap];
    for (int i = 0; i < count; i++) bigger[i] = heap[i];
    delete[] heap;
    heap = bigger;
    capacity = newCap;
}

// a outranks b if it is more urgent, or equally urgent but booked earlier.
bool PriorityQueue::higher(const Appointment* a, const Appointment* b) {
    if (a->priority != b->priority) return a->priority > b->priority;
    return a->id < b->id;   // earlier arrival wins the tie (FIFO within a level)
}

void PriorityQueue::swapAt(Appointment** h, int i, int j) {
    Appointment* t = h[i];
    h[i] = h[j];
    h[j] = t;
}

void PriorityQueue::siftUp(int i) {
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (higher(heap[i], heap[parent])) {
            swapAt(heap, i, parent);
            i = parent;
        } else {
            break;
        }
    }
}

void PriorityQueue::siftDown(int i) {
    while (true) {
        int left = 2 * i + 1;
        int right = 2 * i + 2;
        int best = i;
        if (left < count && higher(heap[left], heap[best])) best = left;
        if (right < count && higher(heap[right], heap[best])) best = right;
        if (best == i) break;
        swapAt(heap, i, best);
        i = best;
    }
}

void PriorityQueue::push(Appointment* a) {
    if (a == nullptr) return;
    if (count == capacity) grow();
    heap[count] = a;
    siftUp(count);
    count++;
}

Appointment* PriorityQueue::pop() {
    while (count > 0) {
        Appointment* top = heap[0];
        heap[0] = heap[count - 1];
        count--;
        if (count > 0) siftDown(0);
        // Lazy deletion: discard entries no longer scheduled and keep going.
        if (top->status == SCHEDULED) return top;
    }
    return nullptr;
}

Appointment* PriorityQueue::peek() {
    // Drop stale entries from the top until we find a live one.
    while (count > 0 && heap[0]->status != SCHEDULED) {
        heap[0] = heap[count - 1];
        count--;
        if (count > 0) siftDown(0);
    }
    return count > 0 ? heap[0] : nullptr;
}

void PriorityQueue::clear() { count = 0; }

int PriorityQueue::size() const { return count; }
