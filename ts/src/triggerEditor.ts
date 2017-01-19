import {TrigAlEditBase} from './trigAlEditBase';
import {TriggerManager} from './triggerManager';

declare let $;

export class TriggerEditor extends TrigAlEditBase {
    private pTriggerManager: TriggerManager;

    constructor(pTriggerManager: TriggerManager) {
        super();
        
        this.pTriggerManager = pTriggerManager;
    }

    protected default_value =
         "Put the trigger value here.\n"
        +"This can be 1 or more commands, including match parameters (e.g. $1) for regex triggers.\n\n"
        +"For regex triggers, use ${groupnum} to represent the matches from your regex pattern.\n"
        +"Example: Trigger pattern '(\\w+) has arrived.', trigger value 'say Hi $1', "
        +"then if 'Vodur has arrived' comes through, 'say hi Vodur' will be sent.";

    protected default_script =
         "/* Put the script here.\n"
        +"This is javascript code that will run when the trigger fires.\n"
        +"You are prevented from creating global variables.\n"
        +"Use 'var' keyword to create local variables.\n"
        +"Add values to the 'this' object to share persistent data between scripts.\n"
        +"Example: this.my_val = 123;\n"
        +"Every script that runs has the same 'this' object.\n"
        +"\n"
        +"Use the send() function to send commands to the mud. Example: send('kill orc');\n"
        +"For regex triggers, 'match' will be the javascript match array, with \n"
        +"indices according to match groups.\n";

    protected default_pattern = null;

    protected get_elements() {
        this.win = $('#win_trig_edit');
        this.list_box = $('#trig_list_box');
        this.pattern = $('#trig_pattern');
        this.regex_checkbox = $('#trig_regex_checkbox');
        this.script_checkbox = $('#trig_script_checkbox');
        this.text_area = $('#trig_text_area');
        this.script_area = $('#trig_script_area');
        this.new_button = $('#trig_new_button');
        this.delete_button = $('#trig_delete_button');
        this.save_button = $('#trig_save_button');
        this.cancel_button = $('#trig_cancel_button');
        this.main_split = $('#trig_main_split');
    };

    protected get_list() {
        var triggers = this.pTriggerManager.triggers;
        var lst = [];
        for (var i=0; i < triggers.length; i++) {
            lst.push(triggers[i].pattern);
        }

        return lst;
    };

    protected get_item(ind) {
        var triggers = this.pTriggerManager.triggers;
        if (ind < 0 || ind >= triggers.length) {
            return null;
        } else {
            return triggers[ind];
        }
    };

    protected save_item(ind, pattern, value, regex, is_script) {
        var trig = {
            pattern: pattern,
            value: value,
            regex: regex,
            is_script: is_script
        }
        if (ind < 0) {
            // New trigger
            this.pTriggerManager.triggers.push(trig);
        } else {
            // Update trigger
            this.pTriggerManager.triggers[ind] = trig;
        }
        this.pTriggerManager.save_triggers();
    };

    protected delete_item(ind) {
        this.pTriggerManager.triggers.splice(ind, 1);
        this.pTriggerManager.save_triggers();
    };
}