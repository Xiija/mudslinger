import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import * as net from "net";
import * as fs from "fs";
import * as readline from "readline";

import { IoEvent } from "../shared/ioevent";

let serverConfig = require("../../configServer.js");
console.log(serverConfig);

let cwd = process.cwd();

let app: express.Express;
let server: http.Server;
let io: SocketIO.Server;

let telnetIdNext: number = 0;

interface connInfo {
    telnetId: number;
    userIp: string;
    host: string;
    port: number;
};

let openConns: {[k: number]: connInfo} = {};

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

        openConns[telnetId] = {
            telnetId: telnetId,
            userIp: client.request.connection.remoteAddress,
            host: host,
            port: port,
        };

        telnet.on("data", (data: Buffer) => {
            ioEvt.srvTelnetData.fire(data.buffer);
        });
        telnet.on("close", (had_error: boolean) => {
            delete openConns[telnetId];
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
            delete openConns[telnetId];
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
        app.use('/test', express.static("static/test", {
            index: "test.html"
        }));
    }

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

const ADMIN_SOCK_PATH = "admin_if.sock";

if (fs.existsSync(ADMIN_SOCK_PATH)) {
    fs.unlinkSync(ADMIN_SOCK_PATH);
}


type adminFunc = (sock: net.Socket, args: string[]) => void;


let adminFuncs: {[k: string]: adminFunc} =  {};
adminFuncs["help"] = (sock: net.Socket, args: string[]) => {
    sock.write("Available commands:\n\n");
    for (let cmd in adminFuncs) {
        sock.write(cmd + "\n");
    }
};

adminFuncs["ls"] = (sock: net.Socket, args: string[]) => {
    sock.write("Open connections:\n\n");
    for (let tnId in openConns) {
        let o = openConns[tnId];
        sock.write( o.telnetId.toString() + 
                    ": " + o.userIp  +
                    " => " + o.host + "," + o.port.toString() +
                    "\n");
    }
};

let adminServer = net.createServer((socket: net.Socket) => {
    console.log("{{admin connection opened}}");

    let rl = readline.createInterface({
        input: socket
    });

    rl.on("line", (line: string) => {
        let words = line.split(" ");

        if (words.length > 0) {
            let afunc = adminFuncs[words[0]];

            if (!afunc) {
                socket.write("No such command. Try 'help'.\n");
            } else {
                try {
                    afunc(socket, words.slice(1));
                }
                catch (err) {
                    console.log("{{admin error '" + line + "':", err, "}}");
                    socket.write("COMMAND ERROR\n");
                }
            }
        }

        socket.write("admin> ");
    });

    socket.on("close", () => {
        console.log("{{admin closed}}");
    });

    socket.write("admin> ");
});

adminServer.listen(ADMIN_SOCK_PATH);
