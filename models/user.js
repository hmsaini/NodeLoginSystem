const mongoose = require('mongoose');
var bcrypt=require('bcryptjs');

mongoose.connect('mongodb://localhost/LoginApp', { useNewUrlParser: true }) // playground->database
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connected to MongoDB...', err));
var db=mongoose.connection;
// User Schema
var UserSchema=mongoose.Schema({
username:{
	type:String,
	index:true
},
password:{
	type:String,
	required:true,
	bcrypt:true
},
email:{
	type:String
},
name:{
	type:String
},
profileimage:{
	type:String
}
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback){
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(newUser.password, salt, function(err, hash) {
	        newUser.password = hash;
	        newUser.save(callback);
	    });
	});
}

module.exports.getUserByUsername = function(username, callback){
	var query = {username: username};
	User.findOne(query, callback);
}

module.exports.getUserById = function(id, callback){
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) throw err;
    	callback(null, isMatch);
	});
}