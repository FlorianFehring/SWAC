const express = require('express')
const cors = require('cors')
const https = require('https')
const fs = require('fs')
const app = express()
const path = require('path')
const port = 3000

const magicMapperName = 'MM-NEO-M8N GNSS'
const magicMapperAddress = '00:12:F3:36:16:2B'
const magicMapperFormat = '$GNGGA'

// Server certificate
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}


// Response object
const response = {
  data_string: "",
  data_json: "",
  connected: false,
  error: ""
}

const notConnected = () => {
  response.data_string = "",
  response.data_json = "",
  response.connected = false,
  response.error = "Magic Mapper not connected"
}

// Convert GNGGA string to JSON
const gngga2json = (str) => {
  const data = str.split(',')
  if (data.length !== 15) {
    return {}
  }
  const json = {
    format: data[0],
    utc_time: data[1],
    latitude: data[2],
    latitudeHemisphere: data[3],
    longitude: data[4],
    longitudeHemisphere: data[5],
    gnss_positioning_status: data[6],
    number_of_satellites_used: data[7],
    hdop_level_precision_factor: data[8],
    altitude: data[9],
    height_of_the_earth_ellipsoid_relative_to_the_geoid: data[10],
    differential_time: data[11],
    differential_reference_base_station_label: data[12],
    cr_lf: data[14]
  }
  return json
}

// Set up bluetooth serial port
var btSerial = new (require("bluetooth-serial-port").BluetoothSerialPort)();
btSerial.on("found", function (address, name) {
  console.log("name: " + name + ", address: " + address);
  btSerial.findSerialPortChannel(
      address,
      function (channel) {
          btSerial.connect(
              address,
              channel,
              function () {
                if (name === magicMapperName) {
                  console.log("connected to " + name);
                  response.error = "";
                  response.connected = true;

                  btSerial.on("data", function (buffer) {
                    const data = buffer.toString("utf-8").split('\n');
                    data.forEach( (item) => {
                      if (item.slice(0,6) === magicMapperFormat) {
                        console.log(item);
                        response.data_string = item;
                        response.data_json = gngga2json(item);
                      }
                    })
                  });
                  btSerial.on("closed", function () {
                    console.log("closed");
                    notConnected();
                  })
                }
                else {
                  btSerial.close();
                  notConnected();
                }
              },
              function () {
                  console.log("cannot connect");
                  btSerial.close();
                  notConnected();
              }
          );
          // close the connection when you're ready
          btSerial.close();
          notConnected();
      },
      function () {
          console.log("found nothing");
          notConnected();
      },

  );
});

// Start looking for devices
btSerial.inquire();

// use cors
app.use(cors())

// Route
app.get('/', (req, res) => {
  res.send(response);
})

// Basic Page to inform about successful connection
app.get('/accept', (req, res) => {
  res.sendFile(path.join(__dirname, '/accept.html'));
});

// create https server with self-signed certificate
const httpsServer = https.createServer(options, app)

// listen on port
httpsServer.listen(port, () => {
  console.log(`Pi-Bt listening on port ${port}`)
});
