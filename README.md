# Documentation for `lidar-firebase`(Client-Server Communication)

_Written By: Harish Rohan Kambhampaty (UntitledError-09, harishrohank@gmail.com)_

This is part of the **LiDAR Data Streaming** Project developed at TiHAN, IIT-H

This is an **alternative** to using WebRTC; when either of the devices are behind Symmetric NAT (AKA Full-Cone NAT). The type of NAT can be checked [here](https://clients.dh2i.com/NatTest/). Permissive NAT is a requirement for Peer-to-Peer (WebRTC) communication.

To learn more about NAT, go [here](https://dh2i.com/kbs/kbs-2961448-understanding-different-nat-types-and-hole-punching/).

_NOTE: A TURN Server is often cheaper than this method, however, it only allows single subscriber of the data stream. In contrast, this method allows multiple subscribers._

# Environment Setup

[ROS](https://www.ros.org/) (preferably [melodic](http://wiki.ros.org/melodic/Installation/Ubuntu) version for Ubuntu 18.04) is required to be setup on both the sender (encoder) and the receiver (decoder).

## ROS-Bridge Server Setup

ROS-Bridge server needs to be installed for [roslibjs](http://wiki.ros.org/roslibjs) which was part of the project that this repository was intended for.

Installation: (Change `melodic` to the required version)

```bash
sudo apt-get install ros-melodic-rosbridge-server
```

Starting Server:

```bash
roslaunch rosbridge_server rosbridge_websocket.launch
```

Node Package Manager (NPM) and [Node.js](https://nodejs.org/en/) are required to be installed (`npm@6.14+`, `node@14.17+`).

## Firebase Setup

1. Navigate to [Firebase website](https://console.firebase.google.com/)
1. Click on `Add project`
1. Enter project name (`lidar-fb`)
1. Click on `continue`
1. In the `Project Overview` page, click on `</>` to create new _web_ app ![create web app image](/docs/createWebApp.jpg)
1. Register Web App with a nickname (`lidar-fb`), and click `continue`
1. Copy the Firebase Configuration code (`firebaseConfig`)
1. Paste it by overwriting the old values in `src/index.js`
1. Go to [Realtime Database (RTDB)](https://console.firebase.google.com/project/lidar-fb/database) page, and click on `Create Database`
1. Choose `Singapore (asia-southeast1)` as the RTDB location (or whichever closest)
1. Choose to `Start in test mode`
1. Click in [Rules]() tab and edit the json document with the following code and `Publish` changes:

```json
{
    "rules": {
        ".read": "true", // Can be read for forever, by anyone.
        ".write": "true" // Can be written in forever, by anyone.
    }
}
```

13. (Optional) To modify the `Rules`, read more about them [here](https://firebase.google.com/docs/database/security/get-started)

_Firebase_ is now setup and ready for use!

# Obtaining Source Code and Building

The source code is available [here](https://github.com/bhaskar-anand-iith/lidar-fb).

Run the following commands:

```bash
cd ~ #directory where the project is to be located
git clone https://github.com/bhaskar-anand-iith/lidar-fb
cd lidar-fb/ #root of project
npm i #installing dependencies
```

## Troubleshooting Build Errors

-   Version Error: ensure `npm@6.14+`, and `node@14.17+`

```bash
npm -v
node -v
```

# Execution

For testing locally:

```bash
npm run dev #runs the "dev" srcipt defined in package.json
```

If changes are made to `src/index.js`, then `dist/bundle.js` has to be recompiled using the command:

```bash
npm run webpack
```

## Webpage Operation

The Sender and receiver must be in the same `room`. The room can be chosen from the URL (Address Bar). By default, an 8-digit random ID is assigned.

**Sender/Sensor side:** Once the webpage has loaded, the webpage automatically subscribes to `/n2b_data` rostopic, and immediately starts publishing to the RTDB.

**Receiver/Visualizer side:** Once the webpage has loaded, the user must click on `start` button to subscribe to the RTDB, and then starts publishing to `/b2n_data` rostopic. When the `stop` button is clicked, the RTDB is unsubscribed.

## ROSTopic Specifications

Subscribes to `/n2b_data` rostopic (from native c++ code)

Publishes to `/b2n_data` rostopic (from browser)

# Deployment

The app has been deployed on [Heroku](https://www.heroku.com/). It is connected with GitHub (through a webhook) and automatically deploys any changes that are made to the `main` branch (by default) in the connected GitHub repository.

**Requires a Heroku account**

## Heroku Setup

1. Go to Heroku [Dashboard](https://dashboard.heroku.com/apps/)
1. Click on `New` -> [Create new app](https://dashboard.heroku.com/new-app)
1. Enter App name, choose a region, and click `Create app`
1. In the `Deploy` tab, set the deployment method to `GitHub` ![heroku deploy screen](/docs/heroku-deploy-1.jpg)
1. Search for the repository name (`lidar-fb`) (you **must** be owner of repository on GitHub. Explore _GitHub Teams_ for more features)
1. `Enable Automatic Deploys` and `Deploy Branch` (main)

The webapp will take some time to be built and deployed. The webapp can be accessed at `App-name`.herokuapp.com

For additional build information, access the `Activity` tab and click on the build of choice.

# Troubleshooting Common Errors

-   Not receiving any data from RTDB: check network status, firebase usage limits
-   Receiving data but no visualization in RViz: check if roscore, ros-bridge server, and [decoder](https://github.com/bhaskar-anand-iith/LiDAR_datastream_transceiver) are running.
-   No data is being sent: check if roscore, ros-bridge server, and [encoder](https://github.com/bhaskar-anand-iith/LiDAR_datastream_transceiver) are running, firebase usage limits.
-   Latency is continuously increasing over time: bandwidth is insufficient, find a better network.
