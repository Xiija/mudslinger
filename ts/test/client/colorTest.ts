import * as color from "../../src/client/color";

const CLEAR = "0";
const BOLD = "1";
const BLINK = "5";
const REVERSE = "7";

const FG_BLACK = "30";
const FG_RED = "31";
const FG_GREEN = "32";
const FG_YELLOW = "33";
const FG_BLUE = "34";
const FG_MAGENTA = "35";
const FG_CYAN = "36";
const FG_WHITE = "37";

const BG_BLACK = "40";
const BG_RED = "41";
const BG_GREEN = "42";
const BG_YELLOW = "43";
const BG_BLUE = "44";
const BG_MAGENTA = "45";
const BG_CYAN = "46";
const BG_WHITE = "47";


function xtfg(color: string) {
    return ["38", "5", color];
}

function xtbg(color: string) {
    return ["48", "5", color];
}


export function test() {
QUnit.module("color");

QUnit.test("ansi colors", (assert: Assert) => {
    let mgr = new color.ColorManager;

    // low fg
    mgr.handleAnsiGraphicCodes([FG_BLACK]);
    assert.strictEqual(mgr.getFgId(), "black-low");
    mgr.handleAnsiGraphicCodes([FG_RED]);
    assert.strictEqual(mgr.getFgId(), "red-low");
    mgr.handleAnsiGraphicCodes([FG_GREEN]);
    assert.strictEqual(mgr.getFgId(), "green-low");
    mgr.handleAnsiGraphicCodes([FG_YELLOW]);
    assert.strictEqual(mgr.getFgId(), "yellow-low");
    mgr.handleAnsiGraphicCodes([FG_BLUE]);
    assert.strictEqual(mgr.getFgId(), "blue-low");
    mgr.handleAnsiGraphicCodes([FG_MAGENTA]);
    assert.strictEqual(mgr.getFgId(), "magenta-low");
    mgr.handleAnsiGraphicCodes([FG_CYAN]);
    assert.strictEqual(mgr.getFgId(), "cyan-low");
    mgr.handleAnsiGraphicCodes([FG_WHITE]);
    assert.strictEqual(mgr.getFgId(), "white-low");

    // many MUDs send clear with every code, so verify that
    mgr.handleAnsiGraphicCodes([CLEAR, FG_BLACK]);
    assert.strictEqual(mgr.getFgId(), "black-low");
    mgr.handleAnsiGraphicCodes([CLEAR, FG_RED]);
    assert.strictEqual(mgr.getFgId(), "red-low");
    mgr.handleAnsiGraphicCodes([CLEAR, FG_GREEN]);
    assert.strictEqual(mgr.getFgId(), "green-low");
    mgr.handleAnsiGraphicCodes([CLEAR, FG_YELLOW]);
    assert.strictEqual(mgr.getFgId(), "yellow-low");
    mgr.handleAnsiGraphicCodes([CLEAR, FG_BLUE]);
    assert.strictEqual(mgr.getFgId(), "blue-low");
    mgr.handleAnsiGraphicCodes([CLEAR, FG_MAGENTA]);
    assert.strictEqual(mgr.getFgId(), "magenta-low");
    mgr.handleAnsiGraphicCodes([CLEAR, FG_CYAN]);
    assert.strictEqual(mgr.getFgId(), "cyan-low");
    mgr.handleAnsiGraphicCodes([CLEAR, FG_WHITE]);
    assert.strictEqual(mgr.getFgId(), "white-low");

    // low bg
    mgr.handleAnsiGraphicCodes([BG_BLACK]);
    assert.strictEqual(mgr.getBgId(), "black-low");
    mgr.handleAnsiGraphicCodes([BG_RED]);
    assert.strictEqual(mgr.getBgId(), "red-low");
    mgr.handleAnsiGraphicCodes([BG_GREEN]);
    assert.strictEqual(mgr.getBgId(), "green-low");
    mgr.handleAnsiGraphicCodes([BG_YELLOW]);
    assert.strictEqual(mgr.getBgId(), "yellow-low");
    mgr.handleAnsiGraphicCodes([BG_BLUE]);
    assert.strictEqual(mgr.getBgId(), "blue-low");
    mgr.handleAnsiGraphicCodes([BG_MAGENTA]);
    assert.strictEqual(mgr.getBgId(), "magenta-low");
    mgr.handleAnsiGraphicCodes([BG_CYAN]);
    assert.strictEqual(mgr.getBgId(), "cyan-low");
    mgr.handleAnsiGraphicCodes([BG_WHITE]);
    assert.strictEqual(mgr.getBgId(), "white-low");

    // many MUDs send clear with every code, so verify that
    mgr.handleAnsiGraphicCodes([CLEAR, BG_BLACK]);
    assert.strictEqual(mgr.getBgId(), "black-low");
    mgr.handleAnsiGraphicCodes([CLEAR, BG_RED]);
    assert.strictEqual(mgr.getBgId(), "red-low");
    mgr.handleAnsiGraphicCodes([CLEAR, BG_GREEN]);
    assert.strictEqual(mgr.getBgId(), "green-low");
    mgr.handleAnsiGraphicCodes([CLEAR, BG_YELLOW]);
    assert.strictEqual(mgr.getBgId(), "yellow-low");
    mgr.handleAnsiGraphicCodes([CLEAR, BG_BLUE]);
    assert.strictEqual(mgr.getBgId(), "blue-low");
    mgr.handleAnsiGraphicCodes([CLEAR, BG_MAGENTA]);
    assert.strictEqual(mgr.getBgId(), "magenta-low");
    mgr.handleAnsiGraphicCodes([CLEAR, BG_CYAN]);
    assert.strictEqual(mgr.getBgId(), "cyan-low");
    mgr.handleAnsiGraphicCodes([CLEAR, BG_WHITE]);
    assert.strictEqual(mgr.getBgId(), "white-low");

    // high fg
    mgr.handleAnsiGraphicCodes([CLEAR]);
    mgr.handleAnsiGraphicCodes([BOLD]);

    mgr.handleAnsiGraphicCodes([FG_BLACK]);
    assert.strictEqual(mgr.getFgId(), "black-high");
    mgr.handleAnsiGraphicCodes([FG_RED]);
    assert.strictEqual(mgr.getFgId(), "red-high");
    mgr.handleAnsiGraphicCodes([FG_GREEN]);
    assert.strictEqual(mgr.getFgId(), "green-high");
    mgr.handleAnsiGraphicCodes([FG_YELLOW]);
    assert.strictEqual(mgr.getFgId(), "yellow-high");
    mgr.handleAnsiGraphicCodes([FG_BLUE]);
    assert.strictEqual(mgr.getFgId(), "blue-high");
    mgr.handleAnsiGraphicCodes([FG_MAGENTA]);
    assert.strictEqual(mgr.getFgId(), "magenta-high");
    mgr.handleAnsiGraphicCodes([FG_CYAN]);
    assert.strictEqual(mgr.getFgId(), "cyan-high");
    mgr.handleAnsiGraphicCodes([FG_WHITE]);
    assert.strictEqual(mgr.getFgId(), "white-high");

    // many MUDs send BOLD with every code, so verify that
    mgr.handleAnsiGraphicCodes([BOLD, FG_BLACK]);
    assert.strictEqual(mgr.getFgId(), "black-high");
    mgr.handleAnsiGraphicCodes([BOLD, FG_RED]);
    assert.strictEqual(mgr.getFgId(), "red-high");
    mgr.handleAnsiGraphicCodes([BOLD, FG_GREEN]);
    assert.strictEqual(mgr.getFgId(), "green-high");
    mgr.handleAnsiGraphicCodes([BOLD, FG_YELLOW]);
    assert.strictEqual(mgr.getFgId(), "yellow-high");
    mgr.handleAnsiGraphicCodes([BOLD, FG_BLUE]);
    assert.strictEqual(mgr.getFgId(), "blue-high");
    mgr.handleAnsiGraphicCodes([BOLD, FG_MAGENTA]);
    assert.strictEqual(mgr.getFgId(), "magenta-high");
    mgr.handleAnsiGraphicCodes([BOLD, FG_CYAN]);
    assert.strictEqual(mgr.getFgId(), "cyan-high");
    mgr.handleAnsiGraphicCodes([BOLD, FG_WHITE]);
    assert.strictEqual(mgr.getFgId(), "white-high");

    // high bg only happens with reverse, test elsewhere
});

QUnit.test("ansi bold", (assert: Assert) => {
    let mgr = new color.ColorManager;

    mgr.handleAnsiGraphicCodes([CLEAR, FG_BLACK]);
    mgr.handleAnsiGraphicCodes([BOLD]);
    assert.strictEqual(mgr.getFgId(), "black-high");

    mgr.handleAnsiGraphicCodes([CLEAR, FG_RED]);
    mgr.handleAnsiGraphicCodes([BOLD]);
    assert.strictEqual(mgr.getFgId(), "red-high");

    mgr.handleAnsiGraphicCodes([CLEAR, FG_GREEN]);
    mgr.handleAnsiGraphicCodes([BOLD]);
    assert.strictEqual(mgr.getFgId(), "green-high");

    mgr.handleAnsiGraphicCodes([CLEAR, FG_YELLOW]);
    mgr.handleAnsiGraphicCodes([BOLD]);
    assert.strictEqual(mgr.getFgId(), "yellow-high");

    mgr.handleAnsiGraphicCodes([CLEAR, FG_BLUE]);
    mgr.handleAnsiGraphicCodes([BOLD]);
    assert.strictEqual(mgr.getFgId(), "blue-high");

    mgr.handleAnsiGraphicCodes([CLEAR, FG_MAGENTA]);
    mgr.handleAnsiGraphicCodes([BOLD]);
    assert.strictEqual(mgr.getFgId(), "magenta-high");

    mgr.handleAnsiGraphicCodes([CLEAR, FG_CYAN]);
    mgr.handleAnsiGraphicCodes([BOLD]);
    assert.strictEqual(mgr.getFgId(), "cyan-high");

    mgr.handleAnsiGraphicCodes([CLEAR, FG_WHITE]);
    mgr.handleAnsiGraphicCodes([BOLD]);
    assert.strictEqual(mgr.getFgId(), "white-high");
});

QUnit.test("ansi reverse", (assert: Assert) => {
    let mgr = new color.ColorManager(
        ["green", "low"],
        ["black", "low"]
    );

    assert.strictEqual(mgr.getFgId(), null);
    assert.strictEqual(mgr.getBgId(), null);

    mgr.handleAnsiGraphicCodes([REVERSE]);
    assert.strictEqual(mgr.getFgId(), "black-low");
    assert.strictEqual(mgr.getBgId(), "green-low");

    // reversing again should change nothing
    mgr.handleAnsiGraphicCodes([REVERSE]);
    assert.strictEqual(mgr.getFgId(), "black-low");
    assert.strictEqual(mgr.getBgId(), "green-low");

    // changing FG color should actually change BG color in reverse mode
    mgr.handleAnsiGraphicCodes([FG_MAGENTA]);
    assert.strictEqual(mgr.getFgId(), "black-low");
    assert.strictEqual(mgr.getBgId(), "magenta-low");

    // changing BG color should actually change FG color in reverse mode
    mgr.handleAnsiGraphicCodes([BG_CYAN]);
    assert.strictEqual(mgr.getFgId(), "cyan-low");
    assert.strictEqual(mgr.getBgId(), "magenta-low");

    mgr.handleAnsiGraphicCodes([CLEAR]);
    assert.strictEqual(mgr.getFgId(), null);
    assert.strictEqual(mgr.getBgId(), null);
});

QUnit.test("xterm colors", (assert: Assert) => {
    let mgr = new color.ColorManager;

    // Set foreground only
    for (let i = 0; i < 256; ++i) {
        mgr.handleAnsiGraphicCodes(xtfg(i.toString()));

        assert.strictEqual(mgr.getFgId(), i.toString());
        assert.strictEqual(mgr.getBgId(), null);
    }

    mgr.handleAnsiGraphicCodes([CLEAR]);

    // Set background only
    for (let i = 0; i < 256; ++i) {
        mgr.handleAnsiGraphicCodes(xtbg(i.toString()));

        assert.strictEqual(mgr.getFgId(), null);
        assert.strictEqual(mgr.getBgId(), i.toString());
    }

    mgr.handleAnsiGraphicCodes([CLEAR]);

    // and setting both
    mgr.handleAnsiGraphicCodes(xtfg("111"));
    mgr.handleAnsiGraphicCodes(xtbg("222"));
    assert.strictEqual(mgr.getFgId(), "111");
    assert.strictEqual(mgr.getBgId(), "222");
});

QUnit.test( "reverse xterm", (assert: Assert) => {
    let mgr = new color.ColorManager(
        ["green", "low"],
        ["black", "low"]
    );

    // Reverse XTERM FG with default ansi BG
    mgr.handleAnsiGraphicCodes(xtfg("136"));
    mgr.handleAnsiGraphicCodes([REVERSE]);

    assert.strictEqual(mgr.getFgId(), "black-low");
    assert.strictEqual(mgr.getBgId(), "136");

    mgr.handleAnsiGraphicCodes([CLEAR]);
    assert.strictEqual(mgr.getFgId(), null);
    assert.strictEqual(mgr.getBgId(), null);

    // Reverse XTERM FG with non-default ansi BG
    mgr.handleAnsiGraphicCodes([BG_MAGENTA]);
    mgr.handleAnsiGraphicCodes(xtfg("136"));
    mgr.handleAnsiGraphicCodes([REVERSE]);

    assert.strictEqual(mgr.getFgId(), "magenta-low");
    assert.strictEqual(mgr.getBgId(), "136");

    mgr.handleAnsiGraphicCodes([CLEAR]);
    assert.strictEqual(mgr.getFgId(), null);
    assert.strictEqual(mgr.getBgId(), null);

    // Reverse XTERM BG with default ansi FG
    mgr.handleAnsiGraphicCodes(xtbg("136"));
    mgr.handleAnsiGraphicCodes([REVERSE]);

    assert.strictEqual(mgr.getFgId(), "136");
    assert.strictEqual(mgr.getBgId(), "green-low");

    mgr.handleAnsiGraphicCodes([CLEAR]);
    assert.strictEqual(mgr.getFgId(), null);
    assert.strictEqual(mgr.getBgId(), null);

    // Reverse XTERM BG with non-default ansi FG
    mgr.handleAnsiGraphicCodes(xtbg("136"));
    mgr.handleAnsiGraphicCodes([FG_MAGENTA]);
    mgr.handleAnsiGraphicCodes([REVERSE]);

    assert.strictEqual(mgr.getFgId(), "136");
    assert.strictEqual(mgr.getBgId(), "magenta-low");

    mgr.handleAnsiGraphicCodes([CLEAR]);
    assert.strictEqual(mgr.getFgId(), null);
    assert.strictEqual(mgr.getBgId(), null);

    // Reverse XTERM FG and BG
    mgr.handleAnsiGraphicCodes(xtfg("111"));
    mgr.handleAnsiGraphicCodes(xtbg("222"));
    mgr.handleAnsiGraphicCodes([REVERSE]);

    assert.strictEqual(mgr.getFgId(), "222");
    assert.strictEqual(mgr.getBgId(), "111");

    mgr.handleAnsiGraphicCodes([CLEAR]);
    assert.strictEqual(mgr.getFgId(), null);
    assert.strictEqual(mgr.getBgId(), null);
});

} // function test
