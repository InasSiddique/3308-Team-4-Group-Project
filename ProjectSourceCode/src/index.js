// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars'); //to enable express to work with handlebars
const Handlebars = require('handlebars'); // to include the templating engine responsible for compiling templates
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

const NUTRISLICE_URL = "https://colorado-diningmenus.api.nutrislice.com";
const NUTRISLICE_LOCATIONS_ENDPOINT = NUTRISLICE_URL + "/menu/api/schools/?";

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST, // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Line for local linking of resources
app.use(express.static(__dirname + '/'));

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// TODO - Include your API routes here
// GET / - redirect to login
app.get('/', (req, res) => {
  res.redirect('/home');
});

app.get('/home', (req, res) => {
  res.render('pages/home');
})

// GET /login
app.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/home');
    return;
  }

  res.render('pages/login');
});

// POST /login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
    if (!user) {
      return res.status(400).render('pages/login', { message: 'Username not found.', error: true });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).render('pages/login', { message: 'Incorrect password.', error: true });
    }
    req.session.user = { id: user.id, username: user.username };
    req.session.save(() => res.redirect('/home'));
    res.status(200)
  } catch (err) {
    console.error(err);
    res.status(400).render('pages/login', { message: 'Something went wrong.', error: true });
  }
});

// GET /register
app.get('/register', (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
    return;
  }

  res.render('pages/register');
});

// POST /register
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.none('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, email, hash]);
    res.status(200).redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(400).render('pages/register', { message: 'Username or email already exists.', error: true });
  }
});

// GET /logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// GET /profile
app.get('/profile', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  try {
    const user = await db.oneOrNone('SELECT id, username, email FROM users WHERE id = $1', [req.session.user.id]);
    if (!user) {
      return res.status(404).render('pages/profile', { message: 'User not found.', error: true });
    }

    const favorites = await db.any('SELECT * FROM favorites WHERE user_id = $1 ORDER BY item_name', [req.session.user.id]);

    let notifications = [];
    if (favorites.length > 0) {
      try {
        const locResponse = await fetch(NUTRISLICE_LOCATIONS_ENDPOINT);
        const locations = await locResponse.json();

        const locationsToCheck = locations.slice(0, 3);

        for (const location of locationsToCheck) {
          const menuType = location.active_menu_types?.[0];
          if (!menuType) continue;

          const today = new Date();
          let url = menuType.urls.digest_menu_by_week_api_url_template
            .replace('{year}', today.getFullYear())
            .replace('{month}', (today.getMonth() + 1).toString().padStart(2, '0'))
            .replace('{day}', today.getDate().toString().padStart(2, '0'));

          const menuResponse = await fetch(NUTRISLICE_URL + url);
          const menuData = await menuResponse.json();

          const menuItems = menuData?.days?.flatMap(day =>
            day?.menu_items?.map(item => item?.food_item?.name?.toLowerCase()) ?? []
          ) ?? [];

          for (const fav of favorites) {
            const match = menuItems.some(item => item?.includes(fav.item_name.toLowerCase()));
            if (match) {
              notifications.push({
                item_name: fav.item_name,
                location: location.name
              });
            }
          }
        }
      } catch (err) {
        console.error('Notification check failed:', err);
      }
    }

    res.status(200).render('pages/profile', { user, favorites, notifications });
  } catch (err) {
    console.error(err);
    res.status(400).render('pages/profile', { message: 'Something went wrong.', error: true });
  }
});

app.post('/profile/favorites/add', async (req, res) => {
  if (!req.session.user) {
    res.status(400).json({ message: "you are not logged in. cannot add favorite." });
    return;
  }

  const { item_name } = req.body;

  if (item_name == null) {
    res.status(400).json({ message: "you must specify an 'item_name' to favorite." })
    return;
  }

  try {
    await db.none('INSERT INTO favorites (user_id, item_name) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.session.user.id, item_name]);
    return res.status(200).redirect('/profile'); //json({ message: "successfully added favorite " });
  } catch (err) {
    console.log(`add-favorite error: ${err}`);
    res.status(400).json({ message: "error adding favorite." });
  }
});

app.post('/profile/favorites/remove', async (req, res) => {
  if (!req.session.user) {
    res.status(400).json({ message: "you are not logged in. cannot add favorite." });
    return;
  }
  const { item_name } = req.body;

  if (item_name == null) {
    res.status(400).json({ message: "you must specify an 'item_name' to favorite." })
    return;
  }
  try {
    await db.none('DELETE FROM favorites WHERE user_id = $1 AND item_name = $2', [req.session.user.id, item_name]);

    res.status(200).redirect('/profile') //json("successfully removed favorite");
  } catch (err) {
    console.log({ message: `REMOVE FAVORITE ERROR: ${err}` });
    res.status(400).json({ message: "an error has occured" })
  }
});

app.get('/profile/favorites', async (req, res) => {
  if (!req.session.user) {
    res.status(400).json({ message: "you are not logged in. cannot get favorites." });
    return;
  }
  try {
    const favorites = await db.any('SELECT * FROM favorites WHERE user_id = $1 ORDER BY item_name', [req.session.user.id]);

    res.status(200).json({ "items": favorites.map(e => e.item_name) })
  } catch (err) {
    console.log({ message: `GET FAVORITES ERROR: ${err}` });
    res.status(400).json({ message: "an error has occured" })
  }

})

// POST /profile/update-password
app.post('/profile/update-password', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const { old_password, new_password } = req.body;
  try {
    // Fetch the current hashed password from the DB
    const user = await db.oneOrNone('SELECT * FROM users WHERE id = $1', [req.session.user.id]);
    if (!user) {
      return res.status(404).render('pages/profile', { message: 'User not found.', error: true });
    }

    // Check that the old password matches
    const match = await bcrypt.compare(old_password, user.password);
    if (!match) {
      return res.status(400).render('pages/profile', { user: { id: user.id, username: user.username, email: user.email }, message: 'Current password is incorrect.', error: true });
    }

    // Hash and save the new password
    const hash = await bcrypt.hash(new_password, 10);
    await db.none('UPDATE users SET password = $1 WHERE id = $2', [hash, req.session.user.id]);

    res.status(200).render('pages/profile', { user: { id: user.id, username: user.username, email: user.email }, message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(400).render('pages/profile', { message: 'Failed to update password.', error: true });
  }
});

// POST /profile/update-username
app.post('/profile/update-username', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const { username } = req.body;
  try {
    await db.none('UPDATE users SET username = $1 WHERE id = $2', [username, req.session.user.id]);
    req.session.user.username = username;
    const user = await db.oneOrNone('SELECT id, username, email FROM users WHERE id = $1', [req.session.user.id]);
    res.status(200).render('pages/profile', { user, message: 'Username updated successfully.' });
  } catch (err) {
    console.error(err);
    const user = await db.oneOrNone('SELECT id, username, email FROM users WHERE id = $1', [req.session.user.id]);
    res.status(400).render('pages/profile', { user, message: 'Username already taken.', error: true });
  }
});

// POST /profile/update-email
app.post('/profile/update-email', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const { email } = req.body;
  try {
    await db.none('UPDATE users SET email = $1 WHERE id = $2', [email, req.session.user.id]);
    req.session.user.email = email;
    const user = await db.oneOrNone('SELECT id, username, email FROM users WHERE id = $1', [req.session.user.id]);
    res.status(200).render('pages/profile', { user, message: 'Email updated successfully.' });
  } catch (err) {
    console.error(err);
    const user = await db.oneOrNone('SELECT id, username, email FROM users WHERE id = $1', [req.session.user.id]);
    res.status(400).render('pages/profile', { user, message: 'Email already in use.', error: true });
  }
});

app.get('/check-session', async (req, res) => {
  if (req.session.user) {
    res.status(200).json("Session active")
    return;
  }

  res.status(400).json("Session inactive")
});

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');

app.get("/getLocations", async (req, res) => {
  try {
    const response = await fetch(NUTRISLICE_LOCATIONS_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();

    return res.status(200).json({ data: result });
  } catch (err) {
    return res.status(400).json({ error: err.toString() });
  }
});

app.get("/getWeeklyMenu", async (req, res) => {
  const location = req.query.location;
  // expects date in yyyy-mm-dd format. Can be gotten from date.toISOString().split("T")[0].
  let date = new Date();

  try {
    if (location == null) {
      return res.status(400).json({ message: "expected 'location' query parameter" })
    }

    if (req.query.full_menu != null && (req.query.full_menu != "true" && req.query.full_menu != "false")) {
      return res.status(400).json({ message: "expected 'full_menu' to be 'true' or 'false'" })
    }
    let full_menu = req.query.full_menu == null || (req.query.full_menu != null && req.query.full_menu == "true");

    if (req.query.date != null) {
      date = new Date(req.query.date);
    }

    const response = await fetch(NUTRISLICE_LOCATIONS_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();

    const locations = result.map(l => l.slug);

    const location_data = result.find(l => l.slug == location);
    if (location_data == null) {
      return res.status(400).json({ message: "location not found.", "locations": locations })
    }

    // get actual menu data for each menu. Due to my knowledge of the nature of the API, this must be split over multiple fetch requests.
    let fetch_urls = [];
    for (var menu of location_data.active_menu_types) {
      // a url endpoint template for the menu. Has the fields "{year}", "{month}", and "{day}".
      let url_template = full_menu ? menu.urls.full_menu_by_date_api_url_template : menu.urls.digest_menu_by_week_api_url_template;

      let full_menu_endpoint = url_template
      full_menu_endpoint = full_menu_endpoint.replace("{year}", date.getFullYear())
      full_menu_endpoint = full_menu_endpoint.replace("{month}", (date.getMonth() + 1).toString().padStart(2, '0'))
      full_menu_endpoint = full_menu_endpoint.replace("{day}", date.getDate().toString().padStart(2, '0'))

      fetch_urls.push(NUTRISLICE_URL + full_menu_endpoint)
    }

    let menu_data = await Promise.all(fetch_urls.map(async url => { const r = await fetch(url); return r.json(); })).catch(e => { throw new Error(`Response status: ${e.status}`); });

    // add data to return object
    for (let i in location_data.active_menu_types) {
      location_data.active_menu_types[i].data = menu_data[i];
    }

    return res.status(200).json({ message: "sucess", data: location_data })
  } catch (err) {
    return res.status(400).json({ error: err.toString() });
  }
});

// test welcome endpoint for lab 10
app.get('/testTestingWorking', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});
