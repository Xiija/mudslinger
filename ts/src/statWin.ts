import {Message} from './message'

declare let $;

export class StatWin {
    private pMessage: Message;

    constructor(pMessage: Message) {
        this.pMessage = pMessage;

        this.pMessage.sub('prepare_reload_layout', this.prepare_reload_layout, this);
        this.pMessage.sub('load_layout', this.load_layout, this);
        this.pMessage.sub('msdp_var', this.handle_msdp_var, this);
    }

    private msdp_vals = {
        'STR': null, 'STR_PERM': null,
        'INT': null, 'INT_PERM': null,
        'CON': null, 'CON_PERM': null,
        'WIS': null, 'WIS_PERM': null,
        'VIT': null, 'VIT_PERM': null,
        'DIS': null, 'DIS_PERM': null,
        'AGI': null, 'AGI_PERM': null,
        'CHA': null, 'CHA_PERM': null,
        'DEX': null, 'DEX_PERM': null,
        'LUC': null, 'LUC_PERM': null
    };

    private html;

    private prepare_reload_layout() {
        this.html = $('#win_stat').html();
    };

    private load_layout() {
        if (this.html) {
            // it's a reload
            $('#win_stat').html(this.html);
            this.html = null;
        }
    };

    private update_stat_win() {
        var output = '';
        output +=
        output += '<h2>STATS</h2>';

        var left = false;

        let print_stat = (label, val, perm) => {
            let color;
            left = !left;
            if (left) {
                color = "red";
            } else {
                color = "cyan";
            }

            output += '<span style="color: '+color+';">';

            output += label + ": ";
            output += ("   " + (this.msdp_vals[perm] || '???')).slice(-3);
            output += "("+(("   " + (this.msdp_vals[val] || '???')).slice(-3))+")";

            output += "</span>"
        }

        output += '<center>';

        print_stat( "Str", "STR", "STR_PERM");
        output += '   ';
        print_stat( "Int", "INT", "INT_PERM");
        output += "<br>";

        print_stat( "Con", "CON", "CON_PERM");
        output += '   ';
        print_stat( "Wis", "WIS", "WIS_PERM");
        output += "<br>";

        print_stat( "Vit", "VIT", "VIT_PERM");
        output += '   ';
        print_stat( "Dis", "DIS", "DIS_PERM");
        output += "<br>";

        print_stat( "Agi", "AGI", "AGI_PERM");
        output += '   ';
        print_stat( "Cha", "CHA", "CHA_PERM");
        output += "<br>";

        print_stat( "Dex", "DEX", "DEX_PERM");
        output += '   ';
        print_stat( "Luc", "LUC", "LUC_PERM");
        output += "<br>";

        output += '</center>';

        $('#win_stat').html("<pre>"+output+"</pre>");
    };

    private handle_msdp_var(msg) {
        if (!(msg.var in this.msdp_vals)) {
            return;
        }

        this.msdp_vals[msg.var] = msg.val;

        this.update_stat_win();
    };
}
