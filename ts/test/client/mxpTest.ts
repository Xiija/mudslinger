import * as mxp from "../../src/client/mxp";

export function test() {
QUnit.module("mxp");

QUnit.test("version tag", (assert: Assert) => {
    let out = new MxpOut;
    let m = new mxp.Mxp(out);

    m.handleMxpTag("<version>");
    let cmd = out.cmds[0];
    assert.strictEqual(cmd.cmd, "\x1b[1z<VERSION CLIENT=Mudslinger MXP=0.01>");
    assert.strictEqual(cmd.noPrint, true);
});

QUnit.test("image tag", (assert: Assert) => {
    let out = new MxpOut;
    let m = new mxp.Mxp(out);

    m.handleMxpTag("<image ui8ytYP.jpg url=\"https://i.imgur.com/\">");
    assert.strictEqual(out.elemStack.length, 0);
    assert.strictEqual(out.popped.length, 1);
    assert.strictEqual(out.popped[0].nodeName, "IMG");
    assert.strictEqual((out.popped[0] as HTMLImageElement).src, "https://i.imgur.com/ui8ytYP.jpg");
});

QUnit.test("a tag", (assert: Assert) => {
    let out = new MxpOut;
    let m = new mxp.Mxp(out);

    m.handleMxpTag("<a href=\"https://i.imgur.com/ui8ytYP.jpg\">");
    assert.strictEqual(out.elemStack.length, 1);
    let elem = out.elemStack[0] as HTMLAnchorElement;
    assert.strictEqual(elem.nodeName, "A");
    assert.strictEqual(elem.href, "https://i.imgur.com/ui8ytYP.jpg");

    m.handleMxpTag("</a>");
    assert.strictEqual(out.elemStack.length, 0);
});

QUnit.test("b tag", (assert: Assert) => {
    let out = new MxpOut;
    let m = new mxp.Mxp(out);

    m.handleMxpTag("<b>");
    assert.strictEqual(out.elemStack.length, 1);
    assert.strictEqual(out.elemStack[0].nodeName, "B");

    m.handleMxpTag("</b>");
    assert.strictEqual(out.elemStack.length, 0);
});

QUnit.test("i tag", (assert: Assert) => {
    let out = new MxpOut;
    let m = new mxp.Mxp(out);

    m.handleMxpTag("<i>");
    assert.strictEqual(out.elemStack.length, 1);
    assert.strictEqual(out.elemStack[0].nodeName, "I");

    m.handleMxpTag("</i>");
    assert.strictEqual(out.elemStack.length, 0);
});

QUnit.test("s tag", (assert: Assert) => {
    let out = new MxpOut;
    let m = new mxp.Mxp(out);

    m.handleMxpTag("<s>");
    assert.strictEqual(out.elemStack.length, 1);
    assert.strictEqual(out.elemStack[0].style.textDecoration, "line-through");

    m.handleMxpTag("</s>");
    assert.strictEqual(out.elemStack.length, 0);
});

QUnit.test("u tag", (assert: Assert) => {
    let out = new MxpOut;
    let m = new mxp.Mxp(out);

    m.handleMxpTag("<u>");
    assert.strictEqual(out.elemStack.length, 1);
    assert.ok(out.elemStack[0].classList.contains("underline"));

    m.handleMxpTag("</u>");
    assert.strictEqual(out.elemStack.length, 0);
});

QUnit.test("send tag 1", (assert: Assert) => {
    // Send tag with explicit href
    let out = new MxpOut;
    let m = new mxp.Mxp(out);

    m.handleMxpTag("<send href=\"do thing 1\">");
    assert.strictEqual(out.elemStack.length, 1);
    let elem = out.elemStack[0] as HTMLAnchorElement;
    assert.strictEqual(elem.title, "do thing 1");
    assert.strictEqual(elem.className, "underline");

    m.handleMxpTag("</send>");
    assert.strictEqual(out.elemStack.length, 0);

    elem.click();
    assert.strictEqual(out.cmds.length, 1);
    assert.strictEqual(out.cmds[0].cmd, "do thing 1");
    assert.notOk(out.cmds[0].noPrint);
});

QUnit.test("send tag 2", (assert: Assert) => {
    // Send tag with explicit href, no href keyword
    let out = new MxpOut;
    let m = new mxp.Mxp(out);

    m.handleMxpTag("<send \"do thing 2\">");
    assert.strictEqual(out.elemStack.length, 1);
    let elem = out.elemStack[0] as HTMLAnchorElement;
    assert.strictEqual(elem.title, "do thing 2");
    assert.strictEqual(elem.className, "underline");

    m.handleMxpTag("</send>");
    assert.strictEqual(out.elemStack.length, 0);

    elem.click();
    assert.strictEqual(out.cmds.length, 1);
    assert.strictEqual(out.cmds[0].cmd, "do thing 2");
    assert.notOk(out.cmds[0].noPrint);
});

QUnit.test("send tag 3", (assert: Assert) => {
    // Send tag with no explicit href
    let out = new MxpOut;
    let m = new mxp.Mxp(out);

    m.handleMxpTag("<send>");
    assert.strictEqual(out.elemStack.length, 1);
    let elem = out.elemStack[0] as HTMLAnchorElement;
    elem.innerText = "do thing 3";

    m.handleMxpTag("</send>");
    assert.strictEqual(out.elemStack.length, 0);

    assert.strictEqual(elem.title, "do thing 3");
    assert.strictEqual(elem.className, "underline");

    elem.click();
    assert.strictEqual(out.cmds.length, 1);
    assert.strictEqual(out.cmds[0].cmd, "do thing 3");
    assert.notOk(out.cmds[0].noPrint);
});

} // function test

class MxpOut implements mxp.IMxpOutput {
    public elemStack: HTMLElement[] = [];
    public popped: HTMLElement[] = [];
    public cmds: Array<{cmd: string, noPrint?: boolean}> = [];

    public pushElem(elem: HTMLElement) {
        this.elemStack.push(elem);
    }

    public popElem(): HTMLElement {
        let popped = this.elemStack.pop();
        this.popped.push(popped);
        return popped;
    }

    public sendCommand(cmd: string, noPrint?: boolean) {
        this.cmds.push({cmd: cmd, noPrint: noPrint});
    }
}