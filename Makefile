CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2
LDFLAGS = -static -static-libgcc -static-libstdc++
TARGET = campusgig.exe

SRCS = main.cpp Platform.cpp User.cpp Job.cpp Application.cpp
OBJS = $(SRCS:.cpp=.o)

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(OBJS) $(LDFLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET) users.txt jobs.txt applications.txt

run: $(TARGET)
	./$(TARGET)

.PHONY: all clean run
