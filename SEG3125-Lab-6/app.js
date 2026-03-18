// Entry point for the application

// express application
var express = require('express');
var path = require('path');
var surveyController = require('./surveyController');

var app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.redirect('/niceSurvey');
});

surveyController(app);

app.listen(3000);
console.log('listening port 3000');