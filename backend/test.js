// const fs = require("fs");

// const POIs = JSON.parse(fs.readFileSync("pois.json", "utf8"));

// const uniquePOIs = Array.from(
//     new Map(POIs.map(poi => [poi.name, poi])).values()
// );
// const POIss = uniquePOIs;

// fs.writeFileSync("pois.json", JSON.stringify(POIss))
// console.log(POIss)

const io = require("socket.io-client")
const socket = io("http://localhost:4242");

// Send your position
socket.emit("update_position", { latitude: 47.73265994485, longitude: 7.348608328078 });

// Receive occupancy updates
socket.on("poi_affluence", (data) => {
    console.log("POI Occupancy Counts:", data);
    // data looks like: [{ name: "Cercopithèques", count: 3 }, ...]
});