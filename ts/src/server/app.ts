import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import * as net from "net";

import { IoEvent } from "../shared/ioevent";

let serverConfig = require("../../configServer.js");
console.log(serverConfig);

let cwd = process.cwd();

let app: express.Express;
let server: http.Server;
let io: SocketIO.Server;

let telnetIdNext: number = 0;

if (serverConfig.useHttpServer === true) {
    app = express();
    server = http.createServer(app);
    io = socketio(server);
} else {
    io = socketio(serverConfig.serverPort);
}

let telnetNs: SocketIO.Namespace = io.of("/telnet");
telnetNs.on("connection", (client: SocketIO.Socket) => {
    let telnet: net.Socket;
    let ioEvt = new IoEvent(client);

    let writeQueue: any[] = [];
    let canWrite: boolean =  true;
    let checkWrite = () => {
        if (!canWrite) { return; }

        if (writeQueue.length > 0) {
            let data = writeQueue.shift();
            canWrite = false;
            canWrite = telnet.write(data as Buffer);
        }
    };

    let writeData = (data: any) => {
        writeQueue.push(data);
        checkWrite();
    };

    client.on("disconnect", () => {
        if (telnet) {
            telnet.end();
            telnet = null;
        }
    });

    ioEvt.clReqTelnetOpen.handle((args: [string, number]) => {
        telnet = new net.Socket();

        let telnetId: number = telnetIdNext++;

        let host: string;
        let port: number;

        let conStartTime: Date;

        if (serverConfig.targetHost != null) {
            host = serverConfig.targetHost;
            port = serverConfig.targetPort;
        } else {
            host = args[0];
            port = args[1];
        }

        telnet.on("data", (data: Buffer) => {
            ioEvt.srvTelnetData.fire(data.buffer);
        });
        telnet.on("close", (had_error: boolean) => {
            ioEvt.srvTelnetClosed.fire(had_error);
            telnet = null;
            let elapsed: number = <any>(new Date()) - <any>conStartTime;
            tlog(telnetId, "::", client.request.connection.remoteAddress, "->", host, port, "::closed after", (elapsed/1000), "seconds");
        });
        telnet.on("drain", () => {
            canWrite = true;
            checkWrite();
        });
        telnet.on("error", (err: Error) => {
            tlog(telnetId, "::", "TELNET ERROR:", err);
            ioEvt.srvTelnetError.fire(err.message);
        });

        try {
            tlog(telnetId, "::", client.request.connection.remoteAddress, "->", host, port, "::opening");
            telnet.connect(port, host, () => {
                ioEvt.srvTelnetOpened.fire(null);
                conStartTime = new Date();
            });
        }
        catch (err) {
            tlog(telnetId, "::", "ERROR CONNECTING TELNET:", err);
            ioEvt.srvTelnetError.fire(err.message);
        }
    });

    ioEvt.clReqTelnetClose.handle(() => {
        if (telnet == null) { return; }
        telnet.end();
        telnet = null;
    });

    ioEvt.clReqTelnetWrite.handle((data) => {
        if (telnet == null) { return; }
        writeData(data);
    });

    ioEvt.srvSetClientIp.fire(client.request.connection.remoteAddress);
});

if (serverConfig.useHttpServer) {
    app.use(express.static("static/public"));

    if (serverConfig.clientTest) {
        app.use('/test', express.static("static/test"));
    }

    app.get("/", function(req, res) {
        res.sendFile("static/index.html", {root: cwd});
    });

    app.use((err: any, req: any, res: any, next: any) => {
        tlog("App error: " +
                    "err: " + err + " | " +
                    "req: " + req + " | " +
                    "res: " + res + " | ");
        next(err);
    });

    server.on("error", (err: Error) => {
        tlog("Server error:", err);
    });

    server.listen(serverConfig.serverPort, function() {
        tlog("Server is running at port", serverConfig.serverPort);
    });
}

function tlog(...args: any[]) {
    console.log("[[", new Date().toLocaleString(), "]]", ...args);
}