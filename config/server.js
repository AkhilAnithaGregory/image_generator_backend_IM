import { Server } from "socket.io";

const server = app.listen(
    process.env.PORT,
    () => {
        console.log("Server running");
    }
);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

app.set("io", io);


// USER SOCKET CONNECTION
io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("join", (userId) => {
        socket.join(userId);
    });

    socket.on("disconnect", () => {
        console.log("Disconnected");
    });
});

//socket.emit("join", user.id); frontend