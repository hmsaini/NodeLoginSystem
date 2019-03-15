var express = require('express');
var router = express.Router();
var multer = require('multer');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var path = require('path');

var User = require('../models/user');
var isMatch = require('../models/user');

/* GET users listing. */
router.get('/', function (req, res, next) {
	res.send('respond with a resource');
});

router.get('/register', function (req, res, next) {
	res.render('register', {
		'title': 'Register'
	});
});

router.get('/login', function (req, res, next) {
	if(req.user){
		// Already logged in
		res.redirect('/');
	}
	res.render('login', {
		'title': 'LogIn'
	});
});

// **********************************************************
var upload = multer({
	storage: multer.diskStorage({

		destination: function (req, file, callback) {
			callback(null, './uploads');
		},
		filename: function (req, file, callback) {
			callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
		}

	}),

	fileFilter: function (req, file, callback) {
		var ext = path.extname(file.originalname)
		if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
			return callback( /*res.end('Only images are allowed')*/ null, false)
		}
		callback(null, true)
	}
});
//   **********************************************************

// POST METHOD
router.post('/register', upload.any(), function (req, res, next) {
	// get form values
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	console.log(req.files);

	var profileimage = '';

	if (req.file) {
		profileimage = req.files[0].filename
	} else {
		profileimage = 'noimage';
	}
	// Form Validators
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Password do not match').equals(req.body.password);

	// Check for errors
	var errors = req.validationErrors();

	if (errors) {
		res.render('register', {
			errors: errors,
			name: name,
			email: email,
			username: username,
			password: password,
			password2: password2,
			profileimage: profileimage
		});
	} else {
		//checking for email and username are already taken
		User.findOne({
			username: {
				"$regex": "^" + username + "\\b",
				"$options": "i"
			}
		}, function (err, user) {
			User.findOne({
				email: {
					"$regex": "^" + email + "\\b",
					"$options": "i"
				}
			}, function (err, mail) {
				if (user || mail) {
					res.render('register', {
						user: user,
						mail: mail
					});
				} else {
					var newUser = new User({
						name: name,
						email: email,
						username: username,
						password: password,
						profileimage: profileimage
					});
					User.createUser(newUser, function (err, user) {
						if (err) throw err;
						console.log(user);
					});
					req.flash('success_msg', 'You are registered and can now login');
					res.redirect('/users/login');
				}
			});
		});
	}
});

// ============== LOGIN  ===================


passport.use(new LocalStrategy(
	function (username, password, done) {
		User.getUserByUsername(username, function (err, user) {
			if (err) throw err;
			if (!user) {
				console.log('Unknown User');
				return done(null, false, {
					message: 'Unknown User'
				});
			}

			User.comparePassword(password, user.password, function (err, isMatch) {
				// if(err) throw err;
				if (isMatch) {
					console.log('valid');
					return done(null, user);

				} else {
					console.log('Invalid Password');
					console.log(user.username);
					console.log(user.password);
					console.log(password);
					return done(null, false, {
						message: 'Invalid Password'
					});
				}
			});
		});
	}
));


passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.getUserById(id, function (err, user) {
		done(err, user);
	});
});


router.post('/login', passport.authenticate('local', {
	successRedirect: '/',
	failureRedirect: '/users/login',
	failureFlash: 'Invalid Username or password'
}), function (req, res) {
	console.log('Authentication Successful');
	req.flash('success_msg', 'You are logged in');
	res.redirect('/');
});



// ===============logout===============
router.get('/logout', function (req, res) {
	req.logout();
	req.flash('success_msg', 'You have logged out');
	res.redirect('/users/login');
});


module.exports = router;