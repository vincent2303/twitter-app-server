
let dotenv = require('dotenv');
dotenv.load();

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.send('<h1>server running</h1>');
});

http.listen(process.env.port, function(){
  console.log('listening on *:' + process.env.port);
});


// try to get coord of tweet
let getCoord = function(event){
  let coord = "no coord" 
  if (event.coordinates || event.place) {
    if (event.coordinates) {
      coord = event.coordinates
    }
    else if (event.place) {
      coord = event.place.bounding_box.coordinates[0][0]
      coord = [coord[1], coord[0]]
    }
  }
  return coord
}

// send the tweet
let sendTweet = function(io, event){
  let coord = getCoord(event)
  let id_str= event.id_str
  io.emit("tweet", {coord: coord, id: id_str})
}


// connect twitterStream
let tweetStream = function(io, searchTerm){
  console.log("tweet stream active")
  let Twitter = require('twitter');

  let client = new Twitter({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });
  var stream = client.stream('statuses/filter', {track: searchTerm});
  stream.on('data', function(event) {
    sendTweet(io, event)
  });
  stream.on('error', function(error) {
    throw error;
  });
}

let a = 3333333;

io.on('connection', function(socket){
  console.log("a user connect")
  socket.on("pauseRequest", ()=>{
    console.log("pause res")
  })
  socket.on("streamRequest", (searchWord)=>{
    console.log("stream res:", searchWord)
    tweetStream(io, searchWord)
  })
});
