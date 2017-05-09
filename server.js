
//Setup mongoose with auto-increments
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    autoIncrement = require('mongoose-auto-increment');

mongoose.Promise = global.Promise;

var connection = mongoose.createConnection('mongodb://admin:admin@ds133231.mlab.com:33231/shorturls002');

autoIncrement.initialize(connection);

var urlSchema = new Schema({
  id: {type: Number},
  url: String
});
urlSchema.plugin(autoIncrement.plugin, {
    model: 'shorturls',
    field: 'id',
    startAt: 1024,
    incrementBy: 16
});

var shorturls = connection.model('shorturls', urlSchema);

//Setup express
var express = require('express');
var app = express();

app.enable('trusted proxy');

app.use(express.static(__dirname + "/public"));
app.set('view-engine', 'html');

app.get('/', (req, res)=>{
    res.send('index');
});


//Setup url route
app.get('/url/:url(*)', (req, res) => {
  console.log(req.params.url);
  var myURL = req.params.url.replace(/\s/g, "");
  var lookByid = myURL.match(/^[0-9]*$/g);
  var lookByURL = myURL.match(/^https?:\/\//);

  if (lookByid) {
    shorturls.findOne({id: myURL}).then((result)=>{
      if (result) {
        console.log(result);
        res.redirect(result.url);
      } else {
        res.send({error: "ID does not exist in database."})
      }
    }).catch((e)=> res.send({error: e}));

  } else if (lookByURL) {
    shorturls.findOne({url: myURL}).then((result)=>{
      var urls = new shorturls({url: myURL});
      console.log(result);
      if (result===null) {
        urls.save().then(()=>{
          console.log("Saved to database.");
            res.send({original_URL: myURL, short_URL: req.protocol + '://' + req.headers.host + '/url/' + urls.id});
        }).catch((e)=>res.send({errorSave: e}));
      }
      else if (result.url === myURL) {
        console.log("Already exists in database.");
        res.send({original_URL: myURL, short_URL: req.protocol + '://' + req.headers.host + '/url/' + result.id});
      }
      else {
        res.send({error: ""})
      }
    }).catch((e)=> res.send({error: e}));
  }
});

app.listen(3000);
