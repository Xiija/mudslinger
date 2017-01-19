import * as Util from "./util";

declare let $;

export class OutWinBase {
    private line_count: number = 0;
    private max_lines: number = 5000;
    public set_max_lines(count: number) {
        this.max_lines = count;
    }

    private fg_color = null;
    private bg_color = null;

    public set_fg_color(color) {
        this.fg_color = color;
    }

    public set_bg_color(color) {
        this.bg_color = color;
    };

    // handling nested elements, always output to last one
    private target_elems = null;
    protected target = null;
    private root_elem = null;

    private scroll_lock = false; // true when we should not scroll to bottom
    private handle_scroll(e) {
        let scrollHeight = this.root_elem.prop("scrollHeight");
        let scrollTop = this.root_elem.scrollTop();
        let outerHeight = this.root_elem.outerHeight();
        let is_at_bottom = outerHeight + scrollTop >= scrollHeight;

        this.scroll_lock = !is_at_bottom;
    }

    // must set root elem before actually using it
    protected set_root_elem(elem) {
        // this may be called upon layout reload
        this.root_elem = elem;
        this.target_elems = [elem];
        this.target =  elem;

        // direct children of the root will be line containers, let"s push the first one.
        this.push_elem($("<span>").appendTo(elem));

        this.root_elem.bind("scroll", (e) => { this.handle_scroll(e); });
    };

    // elem is the actual jquery element
    public push_elem(elem) {
//        console.log(o);
//        console.log("elem pushed");
//        console.log(elem);
        this.write_buffer();

        this.target.append(elem);
        this.target_elems.push(elem);
        this.target = elem;
    }

    public pop_elem() {
        this.write_buffer();

        let popped = this.target_elems.pop();
//        console.log(o);
//        console.log("elem popped");
//        console.log(popped);
        this.target = this.target_elems[this.target_elems.length - 1];
        return popped;
    }

    protected handle_line(line) {
        // default to nothing, main output window will send it to trigger manager
    }

    private append_buffer = "";
    private line_text = ""; // track full text of the line with no escape sequences or tags
    public add_text(txt) {
        this.line_text += txt;
        let html = Util.raw_to_html(txt);
//        let span = $(document.createElement("span"));
        let span_text = "<span";
        let style = "";
        if (this.fg_color || this.bg_color) {
            style = " style=\"";
            if (this.fg_color) {
                style += "color:" + this.fg_color + ";";
            }
            if (this.bg_color) {
                style += "background-color:" + this.bg_color + ";";
            }
            style += "\"";
        }
        span_text += style + ">";
        span_text += html;
        span_text += "</span>";
        this.append_buffer += span_text;

        if (txt.endsWith("\n")) {
            this.target.append(this.append_buffer);
            this.append_buffer = "";
            this.new_line();
        }
    };

    private new_line() {
        this.pop_elem(); // pop the old line
        this.push_elem($("<span>").appendTo(this.target));

        this.handle_line(this.line_text);
        this.line_text = "";

        this.line_count += 1;
        if (this.line_count > this.max_lines) {
            this.root_elem.children(":lt(" +
                (this.max_lines / 2) +
                ")"
            ).remove();
            this.line_count = (this.max_lines / 2);
        }
    }

    private write_buffer() {
        this.target.append(this.append_buffer);
        this.append_buffer = "";
    };

    public output_done() {
        this.write_buffer();
        this.scroll_bottom();
    };

    private scroll_requested = false;
    private _scroll_bottom() {
        console.time("_scroll_bottom");
        let elem = this.root_elem;
        elem.scrollTop(elem.prop("scrollHeight"));
        this.scroll_lock = false;
        this.scroll_requested = false;
        console.timeEnd("_scroll_bottom");
    };

    protected scroll_bottom(force: boolean = false) {
        if (this.scroll_lock && force !== true) {
            return;
        }
        if (this.scroll_requested) {
            return;
        }
        let o = this;
        requestAnimationFrame(() => o._scroll_bottom.call(o));
        this.scroll_requested = true;
//        //if (true) {return;}
//        let elem = o.root_elem;
//        //let scrollHeight = elem.prop("scrollHeight");
//        console.log("scroll calt");
////        let scrollHeight = elem[0].scrollHeight;
//        elem.scrollTop(line_count * 20);
    }
}
