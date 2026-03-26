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
const NUTRISLICE_MENU_ENDPOINT = NUTRISLICE_URL + "/menu/api/schools/?";

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
	host: 'db', // the database server
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

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000);
console.log('Server is listening on port 3000');

app.get("/", async (req, res) => {
	res.status(200).render("pages/login");
});

app.get("/getMenus", async (req, res) => {
	try {
		const response = await fetch(NUTRISLICE_MENU_ENDPOINT);
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		const result = await response.json();

		return res.status(200).json({ data: result });
	} catch (err) {
		return res.status(400).json({ error: err });
	}
});

app.get("/getWeeklyMenu", async (req, res) => {
	const location = req.query.location;

	try {
		if (location == null) {
			return res.status(400).json({ message: "expected 'location' query parameter" })
		}

		const response = await fetch(NUTRISLICE_MENU_ENDPOINT);
		const result = await response.json();

		const locations = result.map(l => l.slug);

		const location_data = result.find(l => l.slug == location);
		if (location_data == null) {
			return res.status(400).json({ message: "location not found.", "locations": locations })
		}

		// get actual menu data for each menu
		let promises = location_data.active_menu_types.map(menu_type => fetch(NUTRISLICE_URL + menu_type.full_menu_by_date_api_url_template))
		let all_promise = Promise.all(promises)

		return res.status(200).json({ message: "sucess", data: location_data })
	} catch (err) {
		return res.status(400).json({ error: err });
	}
});
