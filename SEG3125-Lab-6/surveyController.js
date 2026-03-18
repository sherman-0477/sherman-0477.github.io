// required packages
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var fs = require('fs');

// read the data file
function readData(fileName) {
    let dataRead = fs.readFileSync('./data/' + fileName + '.json');
    let infoRead = JSON.parse(dataRead);
    return infoRead;
}

// read the data file
function writeData(info, fileName) {
    let data = JSON.stringify(info);
    fs.writeFileSync('./data/' + fileName + '.json', data);
}

// update the data file, I use "name" to be equal to fruit, or animal or color
// to match with the file names
// I assume we always just add 1 to a single item
function combineCounts(name, value) {
    let info = readData(name);
    let found = 0;

    for (let i = 0; i < info.length; i++) {
        if (info[i][name] === value) {
            info[i].count = parseInt(info[i].count) + 1;
            found = 1;
        }
    }

    if (found === 0) {
        info.push({ [name]: value, count: 1 });
    }

    writeData(info, name);
}

// This is the controler per se, with the get/post
module.exports = function (app) {

    app.get('/analysis', function (req, res) {
        var color = readData("color");
        var fruit = readData("fruit");
        var animal = readData("animal");
        var name = readData("name");
        var birthday = readData("birthday");
        var comments = readData("comments");

        res.render('showResults', {
            results: {
                color: color,
                fruit: fruit,
                animal: animal,
                name: name,
                birthday: birthday,
                comments: comments
            }
        });
    });

    app.get('/niceSurvey', function (req, res) {
        res.sendFile(__dirname + '/views/niceSurvey.html');
    });

    app.post('/niceSurvey', urlencodedParser, function (req, res) {
        var json = req.body;

        for (var key in json) {
            if (Array.isArray(json[key])) {
                for (var i = 0; i < json[key].length; i++) {
                    combineCounts(key, json[key][i]);
                }
            } else {
                combineCounts(key, json[key]);
            }
        }

        res.json({ success: true });
    });
};