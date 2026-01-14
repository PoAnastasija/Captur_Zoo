const { Server } = require("socket.io");
const { getDistance } = require("./utils/geo");
const fs = require("fs");
const path = require("path");
const pois = require("./pois.js");

// Store user positions: socket.id -> { latitude, longitude }
const userPositions = new Map();

function initSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on("update_position", (data) => {
            const { latitude, longitude } = data;
            console.log(latitude, longitude)
            if (latitude !== undefined && longitude !== undefined) {
                userPositions.set(socket.id, { latitude, longitude });

                // Calculate occupancy for all POIs
                const poiOccupancy = calculatePoiAffluence();

                // Broadcast updated occupancy counts
                io.emit("pois_affluence", poiOccupancy);
            }
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
            userPositions.delete(socket.id);

            // Re-calculate and broadcast after disconnect
            const poiOccupancy = calculatePoiAffluence();
            io.emit("pois_affluence", poiOccupancy);
        });
    });

    return io;
}

function calculatePoiAffluence() {
    console.log("===============================================================================")
    return pois.map(poi => {
        let affluence = 0;
        userPositions.forEach((pos) => {
            const distance = getDistance(poi.latitude, poi.longitude, pos.latitude, pos.longitude);
            console.log(distance)
            if (distance <= 30) {
                affluence++;
            }
        });
        return {
            ...poi,
            affluence: affluence
        };
    });
}

module.exports = { initSocket, calculatePoiAffluence };
