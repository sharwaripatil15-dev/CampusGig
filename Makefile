CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2
LDFLAGS = -static -static-libgcc -static-libstdc++
SERVER_FLAGS = -std=c++17 -Wall -Wextra -O2 -Iinclude
SERVER_LIBS = -lws2_32 -lmswsock

CONSOLE_TARGET = campusgig.exe
SERVER_TARGET = campusgig_server.exe

COMMON_SRCS = Platform.cpp User.cpp Job.cpp Application.cpp
COMMON_OBJS = $(COMMON_SRCS:.cpp=.o)

all: $(CONSOLE_TARGET) $(SERVER_TARGET)

$(CONSOLE_TARGET): main.o $(COMMON_OBJS)
	$(CXX) $(CXXFLAGS) -o $(CONSOLE_TARGET) main.o $(COMMON_OBJS) $(LDFLAGS)

$(SERVER_TARGET): server.cpp $(COMMON_OBJS)
	$(CXX) $(SERVER_FLAGS) -o $(SERVER_TARGET) server.cpp $(COMMON_OBJS) $(SERVER_LIBS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f *.o $(CONSOLE_TARGET) $(SERVER_TARGET)

run-console: $(CONSOLE_TARGET)
	./$(CONSOLE_TARGET)

run-server: $(SERVER_TARGET)
	./$(SERVER_TARGET)

.PHONY: all clean run-console run-server
