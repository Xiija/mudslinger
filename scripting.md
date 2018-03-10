# Scripting API #

All scripts have access to the following scripting API functions:

* <b>print(text)</b>
<br>Print the text to the output window. No return value.

* <b>send(text)</b>
<br>Send the text to the game. No return value.


# Alias Scripts #

## Non-regex Alias Scripts ##
Non-regex alias scripts have the following script arguments:
* <b>input</b> The full command that was input.

## Regex Alias Scripts ##
Regex alias scripts have the following script arguments:
* <b>input</b> The full command that was input.
* <b>match</b> The regex match array.


# Trigger Scripts #

## Non-regex Trigger Scripts ##
Non-regex trigger scripts have the following script arguments:
* <b>line</b> The full line that the trigger matched on.

## Regex Trigger Scripts ##
Regex trigger scripts have the following script arguments:
* <b>line</b> The full line that the trigger matched on.
* <b>match</b> The regex match array.

# Examples #

## Kill 10 orcs then stop
Trigger pattern (non-regex): An orc is DEAD!!
Trigger value (script):
```
#!javascript
this.deadOrcs = this.deadOrcs || 0;
this.deadOrcs++;

print("deadOrcs: " + this.deadOrcs);

if (this.deadOrcs < 10) {
  send("kill orc");
} else {
  send("Already killed 10 orcs.");
}
```