import {Message, MsgDef} from './message';
import * as Util from './util';

declare let $;

const GAUGE_HEIGHT = '18%';
const GAUGE_WIDTH = '100%';

export class GaugeWin {
    private pMessage: Message;
    private msdp_vals = {};
    private update_funcs = {};

    constructor(pMessage: Message) {
        this.pMessage = pMessage;

        this.create_update_funcs();

        this.pMessage.sub('msdp_var', this.handle_msdp_var, this);
        this.pMessage.sub('prepare_reload_layout', this.prepare_reload_layout, this);
        this.pMessage.sub('load_layout', this.load_layout, this);
    }

    private render_gauge_text(curr, max, tag) {
        var rtn = "<pre class='gauge_text'>"+("     " + curr).slice(-5) + " / " + ("     " + max).slice(-5) + " " + tag+"</pre>";
        return rtn;
    }

    private prepare_reload_layout() {
        // nada
    };

    private load_layout() {
        $('#hp_bar').jqxProgressBar({
            width: GAUGE_WIDTH,
            height: GAUGE_HEIGHT,
            value: 50,
            showText: true,
            animationDuration: 0,
            renderText: (text) => {
                return this.render_gauge_text( this.msdp_vals['HEALTH'] || 0, this.msdp_vals['HEALTH_MAX'] || 0, "hp ");
            }
        });

        $('#hp_bar .jqx-progressbar-value').css(
            "background-color", "#DF0101");

        $('#mana_bar').jqxProgressBar({
            width: GAUGE_WIDTH,
            height: GAUGE_HEIGHT,
            value: 50,
            showText: true,
            animationDuration: 0,
            renderText: (text) => {
                //return (msdp_vals.MANA || 0) + " / " + (msdp_vals.MANA_MAX || 0) + " mn";
                return this.render_gauge_text( this.msdp_vals['MANA'] || 0, this.msdp_vals['MANA_MAX'] || 0, "mn ");
            }
        });
        $('#mana_bar .jqx-progressbar-value').css(
                "background-color", "#2E64FE");

        $('#move_bar').jqxProgressBar({
            width: GAUGE_WIDTH,
            height: GAUGE_HEIGHT,
            value: 50,
            showText: true,
            animationDuration: 0,
            renderText: (text) => {
                //return (msdp_vals.MOVEMENT || 0) + " / " + (msdp_vals.MOVEMENT_MAX || 0) + " mv";
                return this.render_gauge_text( this.msdp_vals['MOVEMENT'] || 0, this.msdp_vals['MOVEMENT_MAX'] || 0, "mv ");
            }
        });
        $('#move_bar .jqx-progressbar-value').css(
                "background-color", "#04B4AE");

        $('#enemy_bar').jqxProgressBar({
            width: GAUGE_WIDTH,
            height: GAUGE_HEIGHT,
            value: 0,
            showText: true,
            animationDuration: 0,
            renderText: (text) => {
                return Util.strip_color_tags(this.msdp_vals['OPPONENT_NAME'] || '');
            }
        });
        $('#enemy_bar .jqx-progressbar-value').css(
                "background-color", "purple");

        $('#tnl_bar').jqxProgressBar({
            width: GAUGE_WIDTH,
            height: GAUGE_HEIGHT,
            value: 50,
            showText: true,
            animationDuration: 0,
            renderText: (text) => {
                var tnl = this.msdp_vals['EXPERIENCE_TNL'] || 0;
                var max = this.msdp_vals['EXPERIENCE_MAX'] || 0;
                return this.render_gauge_text( max-tnl, max, "etl");
            }
        });
        $('#tnl_bar .jqx-progressbar-value').css(
                "background-color", "#04B404");

        for (var k in this.update_funcs) {
            this.update_funcs[k]();
        }
    }

    private create_update_funcs() {
        this.update_funcs['HEALTH'] = () => {
            var val = this.msdp_vals['HEALTH'] || 0;
            var max = this.msdp_vals['HEALTH_MAX'] || 0;
            if ( !max || max == 0) { return; }
            $('#hp_bar').jqxProgressBar({ value: 100*val/max });
        };
        this.update_funcs['HEALTH_MAX'] = this.update_funcs['HEALTH'];

        this.update_funcs['MANA'] = () => {
            var val = this.msdp_vals['MANA'] || 0;
            var max = this.msdp_vals['MANA_MAX'] || 0;
            if ( !max || max == 0) { return; }
            $('#mana_bar').jqxProgressBar({ value: 100*val/max });
        }
        this.update_funcs['MANA_MAX'] = this.update_funcs['MANA'];

        this.update_funcs['MOVEMENT'] = () => {
            var val = this.msdp_vals['MOVEMENT'] || 0;
            var max = this.msdp_vals['MOVEMENT_MAX'] || 0;
            if ( !max || max == 0) { return; }
            $('#move_bar').jqxProgressBar({ value: 100*val/max });
        }
        this.update_funcs['MOVEMENT_MAX'] = this.update_funcs['MOVEMENT'];

        this.update_funcs['OPPONENT_HEALTH'] = () => {
            var val = this.msdp_vals['OPPONENT_HEALTH'] || 0;
            var max = this.msdp_vals['OPPONENT_HEALTH_MAX'] || 0;
            if ( !max || max == 0) { return; }
            $('#enemy_bar').jqxProgressBar({ value: 100*val/max });
        }
        this.update_funcs['OPPONENT_HEALTH_MAX'] = this.update_funcs['OPPONENT_HEALTH'];
        this.update_funcs['OPPONENT_NAME'] = this.update_funcs['OPPONENT_HEALTH'];

        this.update_funcs['EXPERIENCE_TNL'] = () => {
            var val = this.msdp_vals['EXPERIENCE_TNL'] || 0;
            var max = this.msdp_vals['EXPERIENCE_MAX'] || 0;
            if ( !max || max == 0) { return; }
            $('#tnl_bar').jqxProgressBar({ value: 100*(max - val)/max });
        }
        this.update_funcs['EXPERIENCE_MAX'] = this.update_funcs['EXPERIENCE_TNL'];
    }

    private handle_msdp_var(data: MsgDef.msdp_var) {
        if (data.varname in this.update_funcs) {
            this.msdp_vals[data.varname] = data.value;
            this.update_funcs[data.varname]();
        }
    }
}
