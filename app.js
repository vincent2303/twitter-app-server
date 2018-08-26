
let dotenv = require('dotenv');
dotenv.load();

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

let Twitter = require('twitter');


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
      return event.coordinates.coordinates
    }
    else if (event.place) {
      return event.place.bounding_box.coordinates[0][0]
    }
  }
  return coord
}

let nombre = 0;
// send the tweet
let sendTweet = function(io, event){
  nombre++
  let coord = getCoord(event)
  let id_str= event.id_str
  if (nombre%5==0) {
    console.log(nombre)
  }
  if (event.user) {
    io.emit("tweet", {coord: coord, id: id_str, name: event.user.name, followers: event.user.followers_count})
  }
  else{
    io.emit("tweet", {coord: coord, id: id_str})
  }
}

io.on('connection', function(socket){
  console.log("user connection")
  let client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });
  socket.on("streamRequest", (searchWord)=>{
    console.log("stream request")
    let activeStream;
    activeStream = client.stream('statuses/filter', {track: searchWord});
    activeStream.on('data', function(event) {
      sendTweet(io, event)
    });
    socket.on("pauseRequest", ()=>{
      activeStream.destroy()
    })
    activeStream.on('error', function(error) {
      throw error;
    });
  })
});
