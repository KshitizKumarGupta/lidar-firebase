import { initializeApp } from "firebase/app";
import { getDoc, getDocs, serverTimestamp, onSnapshot, collection, orderBy, updateDoc, addDoc, deleteDoc, where, getFirestore } from 'firebase/firestore'
import { getDatabase, onValue, ref, set, remove } from 'firebase/database'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBwGFg4UY6XZ5xDC13woCNtewyxFB6Fpd0",
    authDomain: "lidar-fb-ea546.firebaseapp.com",
    projectId: "lidar-fb-ea546",
    storageBucket: "lidar-fb-ea546.appspot.com",
    messagingSenderId: "541212879997",
    appId: "1:541212879997:web:b7edf2a7dc18edecb89514",
    databaseURL: "https://lidar-fb-ea546-default-rtdb.asia-southeast1.firebasedatabase.app/"
};  

// global vars
let unsubRoom;
let sequence_no = 0;
let testData = "sequence_no,payload_size,latency\n";
let last_sent = Date.now();

// roomID
const url = new URL(window.location.href);
let roomID = url.searchParams.get("room");
console.log('roomID: ' + roomID);

if (!roomID) {
    roomID = Math.floor(Math.random() * 100000000);
    console.log('setting roomID: ' + roomID);
    url.searchParams.set('room', roomID);
    window.location.href = url.href;
}
document.getElementById('roomID').value = roomID;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// init services
const fs = getFirestore();
const rtdb = getDatabase(app);

// firestore collection references
// const roomsRef = collection(db, 'rooms');
// const roomsRef = collection(db, 'offers');
// const roomsRef = collection(db, 'answers');
// const roomsRef = collection(db, 'ice');

// rtdb reference
const currRoomRef = ref(rtdb, '/rooms/' + roomID);

// basic write ops
function writeUserData(userId, name, email, imageUrl) {
    set(ref(rtdb, 'users/' + userId), {
        username: name,
        email: email,
        profile_picture: imageUrl
    });
}

function writeToCurrentRoom(room, payload) {
    set(currRoomRef, payload).then(() => {
        console.log(payload.data.data.length);
        last_sent = Date.now();
    }).catch(e => {
        console.log(e)
    })
}

// basic read ops
function subRoom() {
    unsubRoom = onValue(currRoomRef, (snapshot) => {
        const payload = snapshot.val();
        forwardToPublisher(payload);
    });
}
const recvBtn = document.getElementById('recvBtn');
recvBtn.addEventListener('click', (e) => {
    if (unsubRoom) {
        console.log('Unsubscribing from room[' + roomID + '] ...');
        recvBtn.innerHTML = 'start';
        // exportToCsvFile(testData)
        unsubRoom()
        unsubRoom = null;
    } else {
        console.log('Subscribing to room[' + roomID + '] ...');
        sequence_no = 0;
        recvBtn.innerText = 'stop';
        subRoom();
        // setTimeout(() => {
        //     if (unsubRoom) {
        //         recvBtn.click();
        //     }
        // }, 60000);
    }
})

window.onbeforeunload = () => {
    if (!unsubRoom()) {
        remove(currRoomRef).then(() => { alert('Removed') }).catch(() => { alert('Failed to Remove') });
    }
}

writeToCurrentRoom(currRoomRef, { data: "hello" });


// ROS Code

var ros = new ROSLIB.Ros();

// Create a connection to the rosbridge WebSocket server.
ros.connect('ws://localhost:9090');

ros.on('connection', function () {
    console.log('Connected to websocket server.');
});

ros.on('error', function (error) {
    console.log('Error connecting to websocket server: ', error);
});

ros.on('close', function () {
    console.log('Connection to websocket server closed.');
});

// Publishing a Topic
// ------------------

var publisher = new ROSLIB.Topic({
    ros: ros,
    name: '/b2n_data',
    messageType: 'std_msgs/String'
});

// publisher.publish(data);

//Subscribing to a Topic
//----------------------

// Like when publishing a topic, we first create a Topic object with details of the topic's name
// and message type. Note that we can call publish or subscribe on the same topic object.
var listener = new ROSLIB.Topic({
    ros: ros,
    name: '/n2b_data',
    serviceType: 'std_msgs/String'
});

// Then we add a callback to be called every time a message is published on this topic.
listener.subscribe(function (message) {
    const payload = {
        type: 'b64/octree',
        data: message,
        sent_time: Date.now(),
        sequence_no: sequence_no++
    }
    writeToCurrentRoom(currRoomRef, payload);
});

function forwardToPublisher(payload) {
    try {
        if (payload.type === 'b64/octree' && last_sent < payload.sent_time) {
            var pub_payload = new ROSLIB.Message({ data: payload.data.data });
            publisher.publish(pub_payload);
            last_sent = payload.sent_time;
            const lat = Date.now() - payload.sent_time;
            document.getElementById('latency').innerHTML = lat;
            testData += `${payload.sequence_no},${payload.data.data.length},${lat}\n`;
        } else {
            console.log(payload);
        }
    } catch (e) {
        console.log(e);
    }
}

// END ROS Code

function exportToCsvFile(csvStr) {
    let dataUri = 'data:text/csv;charset=utf-8,' + csvStr;

    let exportFileDefaultName = 'data.csv';

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}