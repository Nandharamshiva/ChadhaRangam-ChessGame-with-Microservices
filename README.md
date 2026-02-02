# ChadhaRangam Chess Application

A microservices-based chess application built with Spring Boot and React.

## Architecture

- **Service Registry** (Port 8761): Eureka server for service discovery
- **API Gateway** (Port 8080): Routes requests to microservices
- **User Service** (Port 8081): User authentication and management
- **Game Service** (Port 8082): Chess game logic and move tracking
- **Matchmaking Service** (Port 8083): Player matchmaking
- **Notification Service** (Port 8084): WebSocket notifications
- **Chess Frontend** (Port 5173): React frontend with Vite

## Prerequisites

- Java 21
- Maven 3.6+
- Node.js 18+
- MySQL 8.0+

## Database Setup

Create the required MySQL databases:

```sql
CREATE DATABASE chess_user_db;
CREATE DATABASE chess_game_db;
```

Update the database credentials in:
- `user-service/src/main/resources/application.properties`
- `game-service/src/main/resources/application.properties`

Current default credentials:
- Username: `root`
- Password: `your-password`

## Running the Application

### 1. Start Service Registry (MUST START FIRST)

```bash
cd service-registry
mvn clean install
mvn spring-boot:run
```

Wait until you see "Started ServiceRegistryApplication" then proceed.

### 2. Start API Gateway

```bash
cd api-gateway
mvn clean install
mvn spring-boot:run
```

### 3. Start Microservices (can be started in parallel)

**User Service:**
```bash
cd user-service
mvn clean install
mvn spring-boot:run
```

**Game Service:**
```bash
cd game-service
mvn clean install
mvn spring-boot:run
```

**Matchmaking Service:**
```bash
cd matchmaking-service
mvn clean install
mvn spring-boot:run
```

**Notification Service:**
```bash
cd notification-service
mvn clean install
mvn spring-boot:run
```

### 4. Start Frontend

```bash
cd chess-frontend
npm install
npm run dev
```

## Accessing the Application

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8080
- **Eureka Dashboard**: http://localhost:8761
- **User Service**: http://localhost:8081/api/users
- **Game Service**: http://localhost:8082/api/games
- **Matchmaking Service**: http://localhost:8083/api/matchmaking
- **Notification Service**: http://localhost:8084/api/notifications

## API Endpoints

### User Service
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get JWT token

### Game Service
- `POST /api/games/create` - Create a new game
- `POST /api/games/move` - Make a move
- `GET /api/games/{gameId}/moves` - Get move history

### Matchmaking Service
- `POST /api/matchmaking/find` - Find a match

## Common Issues and Fixes

### Issue 1: Service not registering with Eureka
- Ensure Service Registry is running first
- Check that `eureka.client.service-url.defaultZone` points to `http://localhost:8761/eureka`
- Wait 30-60 seconds for registration

### Issue 2: MySQL Connection Refused
- Ensure MySQL is running
- Verify database credentials in `application.properties`
- Check that databases `chess_user_db` and `chess_game_db` exist

### Issue 3: CORS Errors
- CORS is configured in API Gateway and User Service
- Frontend should be on `http://localhost:5173`

### Issue 4: JWT Token Issues
- JWT secret must match between user-service and api-gateway
- Both services use the same base64-encoded secret

### Issue 5: Port Already in Use
- Kill the process using the port or change the port in `application.properties`

## Troubleshooting Commands

### Check if services are running:
```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 8761,8080,8081,8082,8083,8084,5173 | Select LocalPort,State
```

### Check service registration:
Visit: http://localhost:8761 and verify all services are registered.

### View logs:
Each service prints logs to console. Check for errors like:
- `Connection refused` - Service is not running
- `Port already in use` - Change the port
- `Authentication failed` - Check MySQL credentials

## Development Notes

- All services use Spring Boot 3.3.5
- Spring Cloud version: 2023.0.4
- JWT tokens valid for 24 hours
- Default ELO rating: 1200

## Project Structure

```
ChadhaRangam/
├── service-registry/      # Eureka Server
├── api-gateway/          # API Gateway with JWT validation
├── user-service/         # User management + authentication
├── game-service/         # Chess game logic
├── matchmaking-service/  # Player matching
├── notification-service/ # WebSocket notifications
└── chess-frontend/       # React + Vite + TailwindCSS
```

## Security

- Passwords are encrypted with BCrypt
- JWT tokens for authentication
- CORS configured for localhost development
- OAuth2 placeholders for Google/GitHub (not configured)
