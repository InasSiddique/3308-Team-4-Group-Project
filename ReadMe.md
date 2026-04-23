# 🦬 Buff Bites

A CU Boulder dining hall menu tracker that makes it easy to see what's being served across all campus dining halls. Buff Bites replaces the existing Nutrislice app with a more user-friendly experience. View menus by dining hall, search for specific items, favorite your most liked meals, and get notified when they're on the schedule.

---

## Contributors

| Name | GitHub |
|------|--------|
| Alex Fabian | [@fawfle](https://github.com/fawfle) |
| Kevin Vu | [@Kireisoju](https://github.com/Kireisoju) |
| Aditya Gupta | [@adgu3020](https://github.com/adgu3020) |
| Erin Fels | [@erinfels](https://github.com/erinfels) |
| Inas Siddique | [@InasSiddique](https://github.com/InasSiddique) |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, Bootstrap 5, Handlebars (HBS) |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Templating | Express-Handlebars |
| Authentication | bcryptjs, express-session |
| External API | [Nutrislice API](https://colorado-diningmenus.api.nutrislice.com) |
| Testing | Mocha, Chai, Chai-HTTP |
| Containerization | Docker, Docker Compose |

---

## Prerequisites

Make sure you have the following installed before running the application:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — used to run the app and database in containers
- [Git](https://git-scm.com/) — to clone the repository

No need to install Node.js or PostgreSQL separately — Docker handles all of that.

---

## Running the Application Locally

### 1. Clone the repository
```bash
git clone https://github.com/InasSiddique/3308-Team-4-Group-Project.git
cd 3308-Team-4-Group-Project/ProjectSourceCode
```

### 2. Create a `.env` file
Inside the `ProjectSourceCode/` folder, create a file called `.env` and add the following:
```
POSTGRES_HOST=db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=pwd
POSTGRES_DB=buffbites_db
SESSION_SECRET=supersecretkey
```

### 3. Start the application
```bash
docker compose up
```

This will:
- Install all dependencies
- Run the test suite
- Start the web server on port 3000
- Set up the PostgreSQL database and create all tables automatically

### 4. Open in your browser
Once you see `Server is listening on port 3000` in the terminal, navigate to:
```
http://localhost:3000
```

### 5. Stopping the application
```bash
docker compose down
```

To also wipe the database (useful after changing `create.sql`):
```bash
docker compose down -v
```

---

## Running the Tests

Tests run automatically every time you start the app with `docker compose up`. If you want to run them manually:

```bash
docker compose run web npm test
```

The test suite covers:
- Testing infrastructure health check
- User registration (positive and negative cases)
- User login (valid and invalid credentials)
- Nutrislice API integration (`/getLocations` and `/getWeeklyMenu`)

---

## Deployed Application

🔗 Coming soon

---

## Key Features

- **View dining hall menus** — powered by the Nutrislice API
- **User accounts** — register, log in, and log out securely
- **Password security** — passwords are hashed with bcrypt and must meet strength requirements (8+ characters, uppercase, lowercase, and a number)
- **Profile management** — update your username, email, and password from your profile page
- **Favorites** — save your favorite menu items and get notified when they are being served this week
- **Session protection** — profile and account pages require login
