require("dotenv").config();
const express = require("express");
const http = require("http");
const { initSocket } = require("./socket");
const app = express();
const server = http.createServer(app);

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    if (req.method === 'OPTIONS')
        return res.sendStatus(204);

    next();
});

const api_router = require("./routes/routers.js");
app.use("/api", api_router);

app.get("/", (req, res) => {
    return res.status(200).json({ msg: "Hello world!" });
});

// Initialize Socket.io
initSocket(server);

server.listen(process.env.PORT, () => {
    console.log(`Captur'Zoo backend listening at http://localhost:${process.env.PORT}`);
});
