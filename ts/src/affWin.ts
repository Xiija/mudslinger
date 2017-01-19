import {Message, MsgDef} from "./message";

declare let $;

export class AffWin {
    private pMessage: Message;
    private output: string = null;

    constructor(pMessage: Message) {
        this.pMessage = pMessage;
        this.pMessage.sub("msdp_var", this.handle_msdp_var, this);
        this.pMessage.sub("prepare_reload_layout" , this.prepare_reload_layout, this);
        this.pMessage.sub("load_layout", this.load_layout, this);
    }

    private prepare_reload_layout() {
        // nada
    }

    private load_layout() {
        console.log(this);
        if (this.output) {
            // it"s a reload
            $("#win_aff").html(this.output);
        } else {
            this.show_affects([]);
        }
    }

    private show_affects(affects) {
        this.output = "<h2>AFFECTS</h2>";

        for (let key in affects) {
            this.output += ("   " + affects[key]).slice(-3) + " : " + key + "<br>";
        }

        $("#win_aff").html(this.output);
    };

    private handle_msdp_var(data: MsgDef.msdp_var) {
        if (data.varname !== "AFFECTS") {
            return;
        }
        let val;
        if (data.value === "") {
            val = [];
        } else {
            val = data.value;
        }
        this.show_affects(val);
    };

}
