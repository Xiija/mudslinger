"""
Use to verify behavior in other terminals/clients
"""

import sys


CLEAR = 0
BOLD = 1
BLINK = 5
REVERSE = 7


FG_BLACK = 30
FG_RED = 31
FG_GREEN = 32
FG_YELLOW = 33
FG_BLUE = 34
FG_MAGENTA = 35
FG_CYAN = 36
FG_WHITE = 37


BG_BLACK = 40
BG_RED = 41
BG_GREEN = 42
BG_YELLOW = 43
BG_BLUE = 44
BG_MAGENTA = 45
BG_CYAN = 46
BG_WHITE = 47


if len(sys.argv) > 1 and sys.argv[1] == "lua":
    def seq(*args):
        return "\\27[" + ";".join(map(str, args)) + "m"

    def out(*args):
        print 'sendtochar(mob, "' + "".join(args) + '\\n")'

else:
    def seq(*args):
        return "\x1b[" + ";".join(map(str, args)) + "m"

    def out(*args):
        print "".join(args)


def xfg(color):
    return seq(38, 5, color)


def xbg(color):
    return seq(48, 5, color)


def main():
    out(seq(FG_RED), "FG_RED")
    out(seq(BOLD), "BOLD")

    out(seq(CLEAR))

    out(seq(BG_RED), "BG_RED")
    out(seq(BOLD), "BOLD")

    out(seq(CLEAR))

    out(seq(REVERSE), "REVERSE")
    out(seq(REVERSE), "REVERSE")

    out(seq(FG_MAGENTA), "FG_MAGENTA")
    out(seq(BG_CYAN), "BG_CYAN")

    out(seq(REVERSE), "REVERSE")

    out(seq(CLEAR))

    out(xfg(136), "136")
    out(seq(REVERSE), "REVERSE")


    out(seq(CLEAR))


if __name__ == "__main__":
    main()
