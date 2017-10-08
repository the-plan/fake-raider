/**
 * https://github.com/vert-x3/vertx-service-discovery/blob/master/vertx-service-discovery/src/main/java/io/vertx/servicediscovery/rest/ServiceDiscoveryRestEndpoint.java
 * ```java
 *   ServiceDiscoveryRestEndpoint.create(router, discovery);
 * ```
 * 
 * -> then you can call `/discovery` on each Vert.x microservice
 * eg: http://localhost:8081/discovery -> get the list of the microservices
 */

const express = require("express");
const bodyParser = require("body-parser");
const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');

let port = process.env.PORT || 8888;

let app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

let service = {
  record: {
    name: "--=== FAKE-RAIDER ===--",
    status: "UP",
    type: "http-endpoint",
    location: {
      endpoint: "http://localhost:8888/api",
      host: "localhost",
      port: 8888,
      root: "/api",
      ssl: false
    },
    metadata: {
      kind: "raider",
      message: "ready to fight",
      basestar: null,
      coordinates: {
        x: 100.0, y: 100.0
      }
    } 
  }
}

// get the list of the microservices
fetch(`${process.env.DISCOVERY || "http://localhost:8080/discovery"}`, {
  method:'GET', headers: {"Content-Type": "application/json;charset=UTF-8"}
})
.then(response => {
  return response.json();
})
.then(jsonData => {
  
  let basestars = jsonData.filter(item => item.metadata.kind == "basestar"); // to do: make a filter
  console.log("🤖 basestars: ", basestars)
  // time to register
  fetch(`${process.env.DISCOVERY || "http://localhost:8080/discovery"}`, {
    method:'POST', headers: {"Content-Type": "application/json;charset=UTF-8"},
    body: JSON.stringify(service.record) 
  })  
  .then(response => response.json())
  .then(jsonData => {
    let registration = jsonData.registration
    console.log("😀 service registered, registration: ", registration)

    app.post('/api/coordinates', (req, res) => {
      let data = req.body
      let selectedBaseStar = basestars[0]

      service.record.registration = registration
      service.record.metadata.coordinates = {
        x: data.x, y: data.y, xVelocity: data.xVelocity, yVelocity: data.yVelocity
      }
      service.record.metadata.basestar = {
        name:selectedBaseStar.name,
        color:selectedBaseStar.metadata.color
      }

      console.log("🚀 record", service.record)

      fetch(`http://localhost:8080/discovery/${registration}`, {
        method:'PUT',
        headers: {"Content-Type": "application/json;charset=UTF-8"},
        body: JSON.stringify(service.record)
      })
      .then(response => res.send({messsage: "Hello 🌍, I'm the fake 🚀"}))
      .catch(error => {
        console.log("😡 talking to the basestar: ", error)
      });

    })

    // start the microservice
    app.listen(port)
    console.log("🌍 Discovery Server is started - listening on ", port)

    let selectedBaseStar = basestars[0]

    fetch(`${selectedBaseStar.location.endpoint || "http://localhost:8080/api"}/raiders`, {
      method:'POST', 
      headers: {"Content-Type": "application/json;charset=UTF-8"},
      body: JSON.stringify({
        registration: registration
      }) 
    })  
    .then(response => response.json())
    .then(jsonData => console.log("😀 from 🚀: ", jsonData))
    .catch(error => {
      console.log("😡 talking to the basestar: ", error)
    });

  })
  .catch(error => {
    console.log("😡 registering: ", error)
  });

})
.catch(error => {
  console.log("😡 fetching services: ", error)
});


