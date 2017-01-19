import * as Util from "./util";

declare let $;
declare let CodeMirror;

export interface TrigAlItem {
    pattern: string;
    value: string;
    regex: boolean;
    is_script: boolean;
}

export abstract class TrigAlEditBase {
    protected win = null;

    /* these need to be set in get_elements*/
    protected list_box;
    protected pattern;
    protected regex_checkbox;
    protected script_checkbox;
    protected text_area;
    protected script_area;
    protected code_mirror;
    protected code_mirror_wrapper;
    protected new_button;
    protected delete_button;
    protected main_split;
    protected save_button;
    protected cancel_button;

    /* these need to be overridden */
    protected abstract get_elements();
    protected abstract get_list(): Array<string>;
    protected abstract get_item(ind: number): TrigAlItem;
    protected abstract save_item(ind: number, pattern: string, value: string, checked: boolean, is_script: boolean);
    protected abstract delete_item(ind: number);

    protected abstract default_pattern: string = null;
    protected abstract default_value: string = null;
    protected abstract default_script: string = null;

    private set_editor_disabled(state) {
        this.pattern.prop("disabled", state);
        this.regex_checkbox.prop("disabled", state);
        this.script_checkbox.prop("disabled", state);
        this.text_area.prop("disabled", state);
        this.code_mirror_wrapper.prop("disabled", state);
        this.save_button.prop("disabled", state);
        this.cancel_button.prop("disabled", state);
    }

    private select_none() {
        this.list_box.prop("selectedItem", 0);
        this.list_box.val([]);
    }

    private clear_editor() {
        this.pattern.val("");
        this.text_area.val("");
        this.regex_checkbox.prop("checked", false);
        this.script_checkbox.prop("checked", false);
    }

    private update_list_box() {
        let lst = this.get_list();
        let html = "";
        for (let i = 0; i < lst.length; i++) {
            html += "<option>" + Util.raw_to_html(lst[i]) + "</option>";
        }
        this.list_box.html(html);
    };

    private handle_save_button_click() {
        let ind = this.list_box.prop("selectedIndex");
        let is_script = this.script_checkbox.is(":checked");

        this.save_item(
            ind,
            this.pattern.val(),
            is_script ? this.code_mirror.getValue() : this.text_area.val(),
            this.regex_checkbox.is(":checked"),
            is_script
        );

        this.select_none();
        this.clear_editor();
        this.set_editor_disabled(true);
        this.update_list_box();
    }

    private handle_cancel_button_click() {
        this.clear_editor();
        this.select_none();
        this.set_editor_disabled(true);
    }

    private handle_new_button_click() {
        this.set_editor_disabled(false);
        this.select_none();
        this.pattern.val(this.default_pattern || "INPUT PATTERN HERE");
        this.text_area.val(this.default_value || "INPUT VALUE HERE");
        this.code_mirror.setValue(this.default_script || "// INPUT SCRIPT HERE");
    }

    private handle_delete_button_click() {
        let ind = this.list_box.prop("selectedIndex");

        this.delete_item(ind);

        this.clear_editor();
        this.select_none();
        this.set_editor_disabled(true);
        this.update_list_box();
    }

    private show_script_input() {
        this.text_area.hide();
        this.code_mirror_wrapper.show();
        this.code_mirror.refresh();
    };

    private show_text_input() {
        this.code_mirror_wrapper.hide();
        this.text_area.show();
    };

    private handle_list_box_change() {
        let ind = this.list_box.prop("selectedIndex");
        let item = this.get_item(ind);

        if (!item) {
            return;
        }
        this.set_editor_disabled(false);
        this.pattern.val(item.pattern);
        if (item.is_script) {
            this.show_script_input();
            this.code_mirror.setValue(item.value);
            this.text_area.val("");
        } else {
            this.show_text_input();
            this.text_area.val(item.value);
            this.code_mirror.setValue("");
        }
        this.regex_checkbox.prop("checked", item.regex ? true : false);
        this.script_checkbox.prop("checked", item.is_script ? true : false);
    };

    private handle_script_checkbox_change() {
        let checked = this.script_checkbox.prop("checked");
        if (checked) {
            this.show_script_input();
        } else {
            this.show_text_input();
        }
    };

    private create_window() {
        this.get_elements();

        this.win.jqxWindow({width: 600, height: 400});

        this.main_split.jqxSplitter({
            width: "100%",
            height: "100%",
            orientation: "vertical",
            panels: [{size: "25%"}, {size: "75%"}]
        });

        this.code_mirror = CodeMirror.fromTextArea(
            this.script_area[0], {
                mode: "javascript",
                theme: "neat",
                autoRefresh: true, // https://github.com/codemirror/CodeMirror/issues/3098
                matchBrackets: true,
                lineNumbers: true
            }
        );
        this.code_mirror_wrapper = $(this.code_mirror.getWrapperElement());
        this.code_mirror_wrapper.height("100%");
        this.code_mirror_wrapper.hide();

        this.list_box.change(this.handle_list_box_change);
        this.new_button.click(this.handle_new_button_click);
        this.delete_button.click(this.handle_delete_button_click);
        this.save_button.click(this.handle_save_button_click);
        this.cancel_button.click(this.handle_cancel_button_click);
        this.script_checkbox.change(this.handle_script_checkbox_change);
    };

    public show() {
        if (!this.win) {
            this.create_window();
        }

        this.update_list_box();

        this.win.jqxWindow("open");
    };

}