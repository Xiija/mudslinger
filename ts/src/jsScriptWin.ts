import {JsScript} from "./jsScript";

declare let $;
declare let CodeMirror;

export class JsScriptWin {
    private pJsScript: JsScript;

    private win = null;
    private code_mirror = null;
    private run_button = null;

    constructor(pJsScript: JsScript) {
        this.pJsScript = pJsScript;
    }

    private handle_run_button_click() {
        let code_text = this.code_mirror.getValue();
        let script = this.pJsScript.makeScript(code_text);
        if (script) { script.RunScript(); };
    };

    private get_elements() {
        this.win = $("#win_js_script");
        this.run_button = $("#win_js_script_run_button");
    };

    private create_window() {
        this.get_elements();

        this.win.jqxWindow({width: 600, height: 400});
        this.code_mirror = CodeMirror.fromTextArea(
            document.getElementById("win_js_script_code"),
            {
                mode: "javascript",
                theme: "neat",
                autoRefresh: true, // https://github.com/codemirror/CodeMirror/issues/3098
                matchBrackets: true,
                lineNumbers: true
            }
        );

        this.run_button.click(this.handle_run_button_click);

    };

    public show() {
        if (!this.win) {
            this.create_window();
        }

        this.win.jqxWindow("open");
    };
}
