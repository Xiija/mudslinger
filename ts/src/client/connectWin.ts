import { Socket } from "./socket";

export class ConnectWin {
    private socket: Socket;

    private $win: JQuery;
    private $connectButton: JQuery;
    private $hostInput: JQuery;
    private $portInput: JQuery;

    constructor(socket: Socket) {
        this.socket = socket;

        let win = document.createElement("div");
        win.style.display = "none";
        win.className = "winConnect";
        document.body.appendChild(win);

        win.innerHTML = `
        <!--header-->
        <div>CONNECTION</div>
        <!--content-->
        <div>
            <table style="margin-left: auto;margin-right: auto;margin-top: auto;margin-bottom: auto">
                <tr>
                    <td>Host: </td>
                    <td colspan=2><input size=40 class="winConnect-inputHost"></td>
                </tr>
                <tr>
                    <td>Port: </td>
                    <td><input size=10 class="winConnect-inputPort"></td>
                    <td><button class="winConnect-btnConnect" style="height:100%;width:100%">CONNECT</button></td>
                </tr>
            </table>
        </div>
        `;

        this.$win = $(win);
        this.$connectButton = $(win.getElementsByClassName("winConnect-btnConnect")[0]);
        this.$hostInput = $(win.getElementsByClassName("winConnect-inputHost")[0]);
        this.$portInput = $(win.getElementsByClassName("winConnect-inputPort")[0]);

        (<any>this.$win).jqxWindow({width: 450, height: 150});
        this.$connectButton.click(this.handleConnectButtonClick.bind(this));
    }

    private handleConnectButtonClick() {
        let host: string = this.$hostInput.val().trim();
        let port: number = this.$portInput.val().trim();

        this.socket.openTelnet(host, port);

        this.hide();
    }

    public show() {
        (<any>this.$win).jqxWindow("open");
        (<any>this.$win).jqxWindow('bringToFront');
    }

    private hide() {
        (<any>this.$win).jqxWindow("close");
    }
}
