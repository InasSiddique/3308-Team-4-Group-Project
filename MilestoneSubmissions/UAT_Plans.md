# Feature 1: User Registration
## Description: A new user should be able to create an account by providing a username, email, and password. The password must be hashed before being stored in the database.

### Test Data
| Field | Value |
| -------- | -------- |
| Username | testuser1 |
| Email | testuser1@colorado.edu |
| Password | SecurePass123 |

### Test Cases
TC-1.1 — Successful Registration

Steps: Navigate to /register, fill in all fields with valid data, click Sign Up\
Expected Result: User is redirected to /login. A new row exists in the users table with the correct username and email. The stored password is hashed (not plaintext).\
Actual Result: (to be filled in during testing)\
Status: (Pass / Fail)

Output:
Database connection successful
    ✓ positive (adding a new user): /register (138ms)

TC-1.2 — Registration with Duplicate Username

Steps: Attempt to register with a username that already exists in the database\
Expected Result: User stays on /register and sees an error message: "Username or email already exists."\
Actual Result: (to be filled in during testing)\
Status: (Pass / Fail)

Output:
Testing Register API
2026-04-02 19:52:35.877 UTC [74] STATEMENT:  INSERT INTO users (username, email, password) VALUES ('testuser', 'example@email.com', '$2a$10$2JulJDIDeDUJJ18BDn3KvewqnxPSgEH4KklRTXHtb3/bQkuiTSDhK')
 error: duplicate key value violates unique constraint "users_username_key"
    at parseErrorMessage (/repository/node_modules/pg-protocol/dist/parser.js:305:11)
    at Parser.handlePacket (/repository/node_modules/pg-protocol/dist/parser.js:143:27)
    at Parser.parse (/repository/node_modules/pg-protocol/dist/parser.js:37:38)
    at Socket.<anonymous> (/repository/node_modules/pg-protocol/dist/index.js:11:42)
    at Socket.emit (node:events:508:28)
    at addChunk (node:internal/streams/readable:559:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
    at Readable.push (node:internal/streams/readable:390:5)
    at TCP.onStreamRead (node:internal/stream_base_commons:189:23) {
      length: 209,
      severity: 'ERROR',
      code: '23505',
      detail: 'Key (username)=(testuser) already exists.',
      hint: undefined,
      position: undefined,
      internalPosition: undefined,
      internalQuery: undefined,
      where: undefined,
      schema: 'public',
      table: 'users',
      column: undefined,
      dataType: undefined,
      constraint: 'users_username_key',
      file: 'nbtinsert.c',
      line: '663',
      routine: '_bt_check_unique',
      query: "INSERT INTO users (username, email, password) VALUES ('testuser', 'example@email.com', '$2a$10$2JulJDIDeDUJJ18BDn3KvewqnxPSgEH4KklRTXHtb3/bQkuiTSDhK')",
      params: undefined
    }
    ✓ negative (adding a user with same username): /register (119ms)

TC-1.3 — Registration with Missing Fields

Steps: Leave one or more fields blank and click Sign Up\
Expected Result: Form does not submit. Browser shows a required field validation message.\
Actual Result: (to be filled in during testing)\
Status: (Pass / Fail)

# Feature 2: User Login and Logout
## Description: A registered user should be able to log in with valid credentials, be redirected to the home page, and log out to end their session. Invalid credentials should be rejected with specific feedback.

### Test Data
| Field | Valid Value | Invalid Value |
| -------- | -------- | -------- |
| Username | testuser1 | unknownuser |
| Password | SecurePass123 | wrongpassword |

### Test Cases
TC-2.1 — Successful Login

Steps: Navigate to /login, enter valid username and password, click Login\
Expected Result: User is redirected to /home. Session is created with the user's info.\
Actual Result: (to be filled in during testing)\
Status: (Pass / Fail)

Output:
Testing Login API
    ✓ positive (valid credentials): /login (65ms)

TC-2.2 — Login with Incorrect Password

Steps: Navigate to /login, enter a valid username but wrong password, click Login\
Expected Result: User stays on /login and sees the error message: "Incorrect password."\
Actual Result: (to be filled in during testing)\
Status: (Pass / Fail)

Output:
Testing Login API
    ✓ negative (invalid credentials): /login (60ms)

TC-2.3 — Login with Non-Existent Username

Steps: Navigate to /login, enter a username that does not exist, click Login\
Expected Result: User stays on /login and sees the error message: "Username not found."\
Actual Result: (to be filled in during testing)\
Status: (Pass / Fail)

TC-2.4 — Successful Logout

Steps: Log in with valid credentials, then navigate to /logout\
Expected Result: Session is destroyed. User is redirected to /login. Navigating back to /home redirects to /login.\
Actual Result: (to be filled in during testing)\
Status: (Pass / Fail)

# Feature 3: Nutrislice API Integration
## Description: The server should be able to successfully fetch dining hall location data and weekly menu data from the Nutrislice API. Responses should return the correct data and handle errors gracefully.

### Test Data
| Parameter | Valid Value | Invalid Value |
| -------- | -------- | -------- |
| location | center-for-community | fakelocation |
| date | 2026-04-07 |  |

### Test Cases
TC-3.1 — Fetch All Dining Hall Locations

Steps: Navigate to http://localhost:3000/getLocations in the browser or via Postman\
Expected Result: Server returns a 200 status with a JSON array of dining hall location objects from the Nutrislice API.\
Actual Result: (to be filled in during testing)\
Status: (Pass / Fail)

TC-3.2 — Fetch Weekly Menu for a Valid Location

Steps: Navigate to http://localhost:3000/getWeeklyMenu?location=center-for-community\
Expected Result: Server returns a 200 status with a JSON object containing menu data for that dining hall for the current week.\
Actual Result: (to be filled in during testing)\
Status: (Pass / Fail)

TC-3.3 — Fetch Weekly Menu for an Invalid Location

Steps: Navigate to http://localhost:3000/getWeeklyMenu?location=fakelocation\
Expected Result: Server returns a 400 status with a JSON error message: "location not found." and a list of valid locations.\
Actual Result: (to be filled in during testing)\
Status: (Pass / Fail)

TC-3.4 — Fetch Weekly Menu Without Providing a Location

Steps: Navigate to http://localhost:3000/getWeeklyMenu with no query parameters\
Expected Result: Server returns a 400 status with a JSON error message: "expected 'location' query parameter".\
Actual Result: (to be filled in during testing)\
Status: (Pass / Fail)
