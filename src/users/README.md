# Users API

This module provides user authentication and management functionality with JWT-based authentication.

## Features

- User registration with password hashing
- User login with JWT token generation
- JWT token refresh mechanism
- User logout functionality
- User profile management
- Role-based access control

## Environment Variables

Add the following environment variables to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
MONGODB_URI=mongodb://localhost:27017/nbc-rag
```

## API Endpoints

### Authentication Endpoints

#### Register User
- **POST** `/users/register`
- **Description:** Register a new user account
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user" // optional, defaults to "user"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    }
  }
  ```

#### Login User
- **POST** `/users/login`
- **Description:** Authenticate user and get JWT tokens
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:** Same as register response

#### Refresh Token
- **POST** `/users/refresh`
- **Description:** Get new access token using refresh token
- **Body:**
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Response:** Same as register response

#### Logout User
- **POST** `/users/logout`
- **Description:** Logout user and invalidate refresh token
- **Headers:** `Authorization: Bearer <access_token>`
- **Response:**
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

#### Get User Profile
- **GET** `/users/profile`
- **Description:** Get current user's profile information
- **Headers:** `Authorization: Bearer <access_token>`
- **Response:**
  ```json
  {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isActive": true,
    "lastLoginAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
  ```

## Authentication Flow

### 1. Registration
1. User submits registration data
2. System checks if email already exists
3. Password is hashed using bcrypt
4. User is created in database
5. JWT access and refresh tokens are generated
6. Tokens are returned to user

### 2. Login
1. User submits email and password
2. System finds user by email
3. Password is verified using bcrypt
4. JWT access and refresh tokens are generated
5. Tokens are returned to user

### 3. Token Usage
1. Client includes access token in `Authorization` header
2. Server validates token using JWT service
3. If valid, request proceeds; if not, 401 Unauthorized is returned

### 4. Token Refresh
1. When access token expires, client uses refresh token
2. Server validates refresh token
3. New access and refresh tokens are generated
4. Old refresh token is invalidated

## Security Features

- **Password Hashing:** Passwords are hashed using bcrypt with salt rounds of 10
- **JWT Tokens:** Access tokens expire in 15 minutes, refresh tokens in 7 days
- **Token Invalidation:** Refresh tokens are invalidated on logout
- **Input Validation:** All inputs are validated using class-validator
- **Error Handling:** Proper error messages without exposing sensitive information

## User Roles

- `user` - Standard user role (default)
- `admin` - Administrator role (can be extended for role-based access)

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than or equal to 6 characters"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

## Example Usage

### Register a new user
```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securepassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securepassword123"
  }'
```

### Access protected endpoint
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Refresh token
```bash
curl -X POST http://localhost:3000/users/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
``` 