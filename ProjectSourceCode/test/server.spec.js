// ********************** Initialize server **********************************

const server = require('../src/index.js'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Check if the Testing Infrastructure is Working', () => {
	// Sample test case given to test / endpoint.
	it('Returns the default welcome message', done => {
		chai
			.request(server)
			.get('/testTestingWorking')
			.end((err, res) => {
				expect(res).to.have.status(200);
				expect(res.body.status).to.equals('success');
				assert.strictEqual(res.body.message, 'Welcome!');
				done();
			});
	});
});

// *********************** WRITE 2 UNIT TESTCASES **************************

// ********************************************************************************
//
describe('Testing Register API', () => {
	before(() => {
		this.origonalError = console.error
		console.error = () => { }
	})
	after(() => {
		console.error = this.origonalError
	})
	it('positive (adding a new user): /register', done => {
		chai
			.request(server)
			.post('/register')
			.send({ username: "new_user", email: "new_email@email.com", password: "password" })
			.end((err, res) => {
				expect(res).to.have.status(200);
				done();
			});
	});
	it('negative (adding a user with same username): /register', done => {
		chai
			.request(server)
			.post('/register')
			.send({ username: "testuser", email: "example@email.com", password: "password" })
			.end((err, res) => {
				expect(res).to.have.status(400);
				done();
			});
	});
})

describe('Testing Login API', () => {
	it('positive (valid credentials): /login', done => {
		chai
			.request(server)
			.post('/login')
			.send({ username: "testuser", password: "password" })
			.end((err, res) => {
				expect(res).to.have.status(200);
				done();
			});
	});
	it('negative (invalid credentials): /login', done => {
		chai
			.request(server)
			.post('/login')
			.send({ username: "testuser", password: "wrongpassword" })
			.end((err, res) => {
				expect(res).to.have.status(400);
				done();
			});
	});
})

describe('Testing Nutrislice API', () => {
	it('positive : /getLocations', done => {
		chai
			.request(server)
			.get('/getLocations')
			.end((err, res) => {
				expect(res).to.have.status(200);
				done();
			});
	});
	it('positive : /getWeeklyMenu', done => {
		chai
			.request(server)
			.get('/getWeeklyMenu')
			.query({ 'location': 'center-for-community', "full_menu": "false" })
			.end((err, res) => {
				expect(res).to.have.status(200);
				done();
			});
	});
})
