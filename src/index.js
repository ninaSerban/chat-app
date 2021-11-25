const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require("bad-words")
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')


const app = express()
const server = http.createServer(app) // creating the server outside of express library to pass it in io
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// socket.emit - emit event to a specific client
// socket.broadcast.emit - emits messages to everybody but that particular client
// io.emit - emits to all connections
// socket.join(room) - emits messages to that specific room
//
// SOCKET Rooms
// io.to().emit - emits events to a specific room (sends messages to everyone in a room)
// socket.broadcast.to().emit - emits events to a specific room except to that specific client

io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    //listener for join
    socket.on('join', ({username, room}, callback) => {
        const { error, user } =  addUser({ id: socket.id, username, room})  // socket.id - unique identifier for that particular connection
        
        if(error){
        return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage("Admin","Welcome")) 
        socket.broadcast.to(user.room).emit('message',generateMessage("Admin has joined")) 
        //emit list of users in room
        io.to(user.room).emit('roomData', {
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback();
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback("Profanity is not allowed!")
        }
        io.to(user.room).emit('message', generateMessage(user.username, message)) 
        callback();
    })

    //Sharing your own location
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',  generateLocationMessage( user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback();
        })

    socket.on('disconnect', () => { 
        const user =  removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage("Admin", `${user.username} has left`))
            //emit list of users in room
            io.to(user.room).emit('roomData', {
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
    })
})


server.listen(port, () => {
    console.log(`Serverup on port ${port}!`)
})