# Quick Start Guide - ChadhaRangam

## Errors Fixed

### 1. **Spring Boot Version Issues** ✅
- **Problem**: game-service, matchmaking-service, and notification-service were using Spring Boot 4.0.2 (doesn't exist)
- **Fix**: Changed to Spring Boot 3.3.5 to match other services

### 2. **Invalid Dependencies** ✅
- **Problem**: Invalid dependency names like `spring-boot-starter-webmvc`, `spring-boot-starter-webmvc-test`
- **Fix**: 
  - Changed `spring-boot-starter-webmvc` → `spring-boot-starter-web`
  - Changed test dependencies → `spring-boot-starter-test`

### 3. **Spring Cloud Version Mismatch** ✅
- **Problem**: Some services using 2025.1.0, others using 2023.0.4
- **Fix**: Standardized all to Spring Cloud 2023.0.4

### 4. **CORS Configuration Missing** ✅
- **Problem**: Frontend couldn't communicate with backend
- **Fix**: Added CORS configuration in:
  - `api-gateway/src/main/java/com/chadharangam/apigateway/config/CorsConfig.java`
  - `user-service/src/main/java/com/chadharangam/userservice/config/CorsConfig.java`

### 5. **JWT Secret Key Issues** ✅
- **Problem**: 
  - Weak secret key in user-service
  - JWT key mismatch between user-service and api-gateway
  - User-service generating random key, api-gateway expecting specific key
- **Fix**: 
  - Changed both services to use configuration-based secret
  - Used strong base64-encoded secret
  - Both services now read from `application.properties`

### 6. **Missing Routes in API Gateway** ✅
- **Problem**: Only 2 routes defined, missing matchmaking and notification services
- **Fix**: Added all routes including WebSocket support

### 7. **User Entity Provider Field Issue** ✅
- **Problem**: `provider` field marked as `nullable=false` but no default value
- **Fix**: Set default value to "LOCAL" and added getter/setter methods

### 8. **Missing Application Routes** ✅
- **Fix**: Updated API Gateway with complete route configuration for all services

## Starting the Application

## Option 0: Docker (Recommended)

1) Create a `.env` file at the repo root (it's gitignored). You can start from `.env.example`.

2) Build + start everything:

```bash
docker compose up --build
```

3) Open:

- Frontend: http://localhost:5173
- Eureka: http://localhost:8761
- API Gateway: http://localhost:8080

To stop:

```bash
docker compose down
```

### Option 1: Automated Start (Windows)
```powershell
cd "C:\Users\HP\Desktop\Java Projects\ChadhaRangam"
.\start-all.ps1
```

### Option 2: Manual Start (Recommended for first time)

**Step 1: Start Service Registry** (MUST BE FIRST)
```bash
cd service-registry
mvn clean install
mvn spring-boot:run
```
Wait until you see: `Started ServiceRegistryApplication in X seconds`

**Step 2: Start API Gateway**
```bash
cd api-gateway
mvn clean install
mvn spring-boot:run
```

**Step 3: Start All Microservices** (in separate terminals)
```bash
# Terminal 1
cd user-service
mvn spring-boot:run

# Terminal 2
cd game-service
mvn spring-boot:run

# Terminal 3
cd matchmaking-service
mvn spring-boot:run

# Terminal 4
cd notification-service
mvn spring-boot:run
```

**Step 4: Start Frontend**
```bash
cd chess-frontend
npm install
npm run dev
```

## Verification Checklist

1. ✅ Check Eureka Dashboard: http://localhost:8761
   - Should show 5 registered instances
   - USER-SERVICE, GAME-SERVICE, MATCHMAKING-SERVICE, NOTIFICATION-SERVICE, API-GATEWAY

2. ✅ Test User Registration:
```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"password123"}'
```

3. ✅ Test User Login:
```bash
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

4. ✅ Check Frontend: http://localhost:5173
   - Should show login page
   - No CORS errors in console

## Database Setup Reminder

**Create databases:**
```sql
CREATE DATABASE chess_user_db;
CREATE DATABASE chess_game_db;
```

## Environment Variables (Required)

To avoid committing secrets to GitHub, the services read sensitive values from environment variables.

Required:

- `DB_PASSWORD` (MySQL password used by `user-service` and `game-service`)
- `JWT_SECRET` (must be the same for `api-gateway` and `user-service`)

Optional (only if you want Google/GitHub login enabled):

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

## Port Configuration

| Service | Port |
|---------|------|
| Service Registry | 8761 |
| API Gateway | 8080 |
| User Service | 8081 |
| Game Service | 8082 |
| Matchmaking Service | 8083 |
| Notification Service | 8084 |
| Frontend | 5173 |

## Common Startup Errors & Solutions

### Error: Port already in use
**Solution:**
```powershell
# Find process using port (e.g., 8080)
Get-NetTCPConnection -LocalPort 8080 | Select OwningProcess
Stop-Process -Id <ProcessId> -Force
```

### Error: Connection refused to MySQL
**Solution:**
1. Ensure MySQL is running: `net start MySQL80`
2. Verify credentials in application.properties
3. Create databases if they don't exist

### Error: Service not registering with Eureka
**Solution:**
1. Ensure Service Registry started first and is fully running
2. Wait 30-60 seconds after starting each service
3. Check Eureka dashboard to confirm registration

### Error: JWT token invalid
**Solution:**
- Ensure user-service and api-gateway are both running
- Both services now use the same JWT secret from configuration
- Try logging in again to get a fresh token

### Error: CORS policy error
**Solution:**
- CORS is now configured in both API Gateway and User Service
- Ensure frontend is running on http://localhost:5173
- Clear browser cache if needed

## Architecture Overview

```
Frontend (React/Vite)
        ↓
API Gateway (8080) ← JWT Validation
        ↓
    Eureka Server (8761)
        ↓
    ┌───┴───┬───────┬─────────┬────────┐
    ↓       ↓       ↓         ↓        ↓
  User   Game   Matchmaking  Notification
  8081   8082      8083         8084
```

## File Changes Summary

**Modified Files:**
1. `game-service/pom.xml` - Fixed Spring Boot version and dependencies
2. `matchmaking-service/pom.xml` - Fixed Spring Boot version and dependencies
3. `notification-service/pom.xml` - Fixed Spring Boot version and dependencies
4. `api-gateway/src/main/resources/application.properties` - Added JWT secret and complete routes
5. `user-service/src/main/resources/application.properties` - Stronger JWT secret
6. `user-service/src/main/java/.../entity/User.java` - Added default provider value and getters/setters
7. `user-service/src/main/java/.../security/JwtUtil.java` - Configuration-based secret
8. `api-gateway/src/main/java/.../security/JwtUtil.java` - Configuration-based secret

**Created Files:**
1. `api-gateway/src/main/java/.../config/CorsConfig.java` - CORS configuration
2. `user-service/src/main/java/.../config/CorsConfig.java` - CORS configuration
3. `README.md` - Complete project documentation
4. `start-all.ps1` - Automated startup script
5. `QUICKSTART.md` - This file

## Next Steps

1. Start all services following the guide above
2. Verify all services are registered in Eureka
3. Test the application through the frontend
4. Check for any remaining errors in service logs

## Need Help?

Check the logs in each service terminal window for detailed error messages.
Most issues are related to:
- MySQL not running or wrong credentials
- Services starting in wrong order
- Port conflicts
