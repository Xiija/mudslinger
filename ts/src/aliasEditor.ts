import {AliasManager} from './aliasManager';
import {TrigAlEditBase, TrigAlItem} from './trigAlEditBase';

declare let $;

export class AliasEditor extends TrigAlEditBase {
    private pAliasManager: AliasManager;


    constructor(pAliasManager: AliasManager) {
        super();

        this.pAliasManager = pAliasManager;
    }

    protected default_pattern = null;

    protected default_value = "Put the alias value here.\n"
            +"This can be 1 or more commands, including match parameters (e.g. $1).\n\n"
            +"For non-regex aliases, use $1 in the value to represent the full argument to the command.\n"
            +"Example: Alias pattern 'blah', alias value 'say $1', "
            +"then issue 'blah asadf dfdfa' and 'say asadf dfdfa' will be sent.\n\n"
            +"For regex aliases, use ${groupnum} to represent the matches from your regex pattern.\n"
            +"Example: Alias pattern 'blah (\\w+)', alias value 'say $1', "
            +"then issue 'blah asadf' and 'say asadf' will be sent.";
    
    protected default_script = "/* Put the script here.\n"
            +"This is javascript code that will run when the trigger fires.\n"
            +"You are prevented from creating global variables.\n"
            +"Use 'var' keyword to create local variables.\n"
            +"Add values to the 'this' object to share persistent data between scripts.\n"
            +"Example: this.my_val = 123;\n"
            +"Every script that runs has the same 'this' object.\n"
            +"\n"
            +"Use the send() function to send commands to the mud. Example: send('kill orc');\n"
            +"For regex aliases, 'match' will be the javascript match array, with \n"
            +"indices according to match groups.\n";

    protected get_elements() {
        this.win = $('#win_alias_edit');
        this.list_box = $('#alias_list_box');
        this.pattern = $('#alias_pattern');
        this.regex_checkbox = $('#alias_regex_checkbox');
        this.script_checkbox = $('#alias_script_checkbox');
        this.text_area = $('#alias_text_area');
        this.script_area = $('#alias_script_area');
        this.new_button = $('#alias_new_button');
        this.delete_button = $('#alias_delete_button');
        this.save_button = $('#alias_save_button');
        this.cancel_button = $('#alias_cancel_button');
        this.main_split = $('#alias_main_split');
    };

    protected get_list() {
        var aliases = this.pAliasManager.aliases;
        var lst = [];
        for (var i=0; i < aliases.length; i++) {
            lst.push(aliases[i].pattern);
        }

        return lst;
    }

    protected get_item(ind) {
        var aliases = this.pAliasManager.aliases;
        if (ind < 0 || ind >= aliases.length) {
            return null;
        } else {
            return aliases[ind];
        }
    }

    protected save_item(ind, pattern, value, regex, is_script) {
        var alias = {
            pattern: pattern,
            value: value,
            regex: regex,
            is_script: is_script
        }
        if (ind < 0) {
            // New alias
            this.pAliasManager.aliases.push(alias);
        } else {
            // Update alias
            this.pAliasManager.aliases[ind] = alias;
        }
        this.pAliasManager.save_aliases();
    }

    protected delete_item(ind) {
        this.pAliasManager.aliases.splice(ind, 1);
        this.pAliasManager.save_aliases();
    }
}