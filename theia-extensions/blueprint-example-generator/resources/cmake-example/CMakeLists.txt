cmake_minimum_required(VERSION 3.10)

# set the project name and version
project(Example VERSION 1.0)

# specify the C++ standard
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Set compile commands for clangd to ON
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
# Turn debugging on
set(CMAKE_BUILD_TYPE Debug)

# Add an executable with the above sources
add_executable(Example src/Rectangle.cpp src/main.cpp)

# add the binary tree to the search path for include files
# so that we will find TutorialConfig.h
target_include_directories(Example PUBLIC
                           "${PROJECT_SOURCE_DIR}/include"
                           )
