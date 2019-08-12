const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const http = require('http').Server(app);
const io = require('socket.io')(http);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));


app.get('/', (request, response) => {
    response.send('OK');
});

require('./app/controllers')(app);

io.on('connection', socket => {
    console.log('a user connected');
    
    socket.on('disconnect', () => {
		console.log('user disconnected');
	});

	socket.on('message', message => {
		console.log('message: ' + message);
		//Broadcast the message to everyone
		io.emit('message', message);
	});
});

app.listen(3000, () =>{
    console.log("Servidor iniciado na porta 3000");
})