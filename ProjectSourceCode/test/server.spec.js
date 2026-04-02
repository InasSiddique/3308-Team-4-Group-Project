// ********************** Initialize server **********************************

const server = require('../src/index.js'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
	// Sample test case given to test / endpoint.
	it('Returns the default welcome message', done => {
		chai
			.request(server)
			.get('/welcome')
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
			.send({ username: "username", email: "example@email.com", password: "password" })
			.end((err, res) => {
				expect(res).to.have.status(400);
				done();
			});
	});
})

describe('Testing Login API', () => {
	it('positive (valid credentials): /login', done => {

	})
})
