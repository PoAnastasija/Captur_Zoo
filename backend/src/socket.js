const { Server } = require("socket.io");
const { getDistance } = require("./utils/geo");
const fs = require("fs");
const path = require("path");

const pois = JSON.parse(fs.readFileSync(path.join(__dirname, "../pois.json"), "utf8"));

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
            if (latitude !== undefined && longitude !== undefined) {
                userPositions.set(socket.id, { latitude, longitude });

                // Calculate occupancy for all POIs
                const poiOccupancy = calculatePoiAffluence();

                // Broadcast updated occupancy counts
                io.emit("poi_affluence", poiOccupancy);
            }
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
            userPositions.delete(socket.id);

            // Re-calculate and broadcast after disconnect
            const poiOccupancy = calculatePoiAffluence();
            io.emit("poi_affluence", poiOccupancy);
        });
    });

    return io;
}

function calculatePoiAffluence() {
    return pois.map(poi => {
        let affluence = 0;
        userPositions.forEach((pos) => {
            const distance = getDistance(poi.latitude, poi.longitude, pos.latitude, pos.longitude);
            if (distance <= 5) {
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
