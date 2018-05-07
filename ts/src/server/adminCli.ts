import * as net from "net";
import * as process from "process";


const ADMIN_SOCK_PATH = "admin_if.sock";

let strm = net.connect(ADMIN_SOCK_PATH);

strm.on("data", (data: Buffer) => {
    process.stdout.write(data);
});

process.stdin.on("data", (data: any) => {
    strm.write(data);
});

strm.on("close", () => {
    console.log("Server was closed.");
    process.exit(1);
});
