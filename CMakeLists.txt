cmake_minimum_required(VERSION 3.10)
project(HospitalSystem CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

add_executable(hms
    src/main.cpp
    src/PatientList.cpp
    src/AppointmentQueue.cpp
    src/FileManager.cpp
)

# Absolute path to data folder, so files are found no matter where the exe runs from
target_compile_definitions(hms PRIVATE DATA_DIR="${CMAKE_SOURCE_DIR}/data/")