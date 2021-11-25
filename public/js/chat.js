const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form') // $ - specifies that is an element of the DOM (convention)
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location') // $ - specifies that is an element of the DOM (convention)
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true}) //parse string into object / ignoreQueryPrefix to remove the "?" when parsing


// Autoscroll
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage) //to check margin bottom dinamycally
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin  // to see total height

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username, 
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm:ss a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll();
})

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage);
    const html = Mustache.render(locationMessageTemplate, {
        username: locationMessage.username, 
        url: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('hh:mm:ss a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    console.log(room,users)
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML = html     //put htl content inside the sidebar document
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault() //cancels the event if it is cancelable
    $messageFormButton.setAttribute('disabled', 'disabled') // disable the button
    const message = e.target.elements.message.value // access the value from input form
    socket.emit('sendMessage', message, (error) => { 
        $messageFormButton.removeAttribute('disabled') // enable the button after the event has been awcknoledged
        $messageFormInput.value = '' // empty the input bar
        $messageFormInput.focus(); // move the mouse cursor inside the form
        if(error){
            return console.log(error);
        }
        console.log('Message delivered!');
    })
})



$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled') // disable the button

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude:position.coords.latitude,
            longitude: position.coords.longitude
        }, () => { 
            $sendLocationButton.removeAttribute('disabled') // enable the button after the event has been awcknoledged
            console.log('Location shared!');
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error)
        location.href='/' // redirect user to main page in case of error
    }
})
