# objectives

starting from this html page `index.html`, and specifically the dummy skeleton above, you will be building a small application for browsing the xkcd comics

so you should obtain something a little bit like https://xkcd.com/, kind of...

# step 0

use your browser to open in a separate page the URLs

* `https://xkcd.now.sh/?comic=latest`
* `https://xkcd.now.sh/?comic=2584`
* `https://xkcd.now.sh/?comic=1`
* `https://xkcd.now.sh/?comic=0`

what does that content look like ?  
what can be the meaning of `num` and `img` fields ?

*hint*: numbers are sequential

# assignment

* you will work your way by editing
  * `index.html`
  * `code.js`
  * `style.css`
* use the usual naming scheme, i.e.
  * variables and functions in `lowercase` or `lowerCamelCase`
  * class names, if any, in `UpperCamelCase`
  * global constants in `UPPERCASE`
* as far as possible, your code should have the smallest possible footprint on
  the global namespace, i.e.
  * avoid declaring globals
  * as far as possible, confine them into functions; this is to avoid any
  possible conflict with other applications

# step 1

write a function `fetchIssue(num)` that

* fetches the URL  
  `https://xkcd.now.sh/?comic=`*`num`*
* decodes it contents
* displays the corresponding 'num' in the status area (and just that for now)

## step 1b

check your work, by connecting the 'reset' button (↺) to `fetchIssue("latest")`

when else could/should we call this, to have the page start up more nicely ?

note that the status area **must display a number** (as opposed to
`latest`)

## step 1c

enhance the function so that the corresponding comics gets displayed in the `<img>` tag

# step 2

improve the display so that the image, as well as the status area, are centered
in the page and do not overlap each other

# step 3

so far we can only get the latest comic; now we want to be able to move back and
forth using the 2 arrow buttons

change your code so that the application behaves that way; a suggested path to this end:

* keep the current number in a state (a variable shared amongst all the
  functions)
* write `next()` and `previous()` functions and connect them to the buttons
* optionally, keep track of the latest number, and enable the 'next' button only
  when relevant

# optional steps

can be done independantly (in no particular order)

## option A

* refactor your code so that it becomes reusable

for example, you could write a class, that gets created from 5 css selectors, so
that the gist of `code.js` becomes (for example)

```
new XkcdBrowser(
    // how to find the 5 elements, from css selectors
    "#xkcd>img",
    "#num",
    "#previous",
    "#reset",
    "#next"
).start()
```

* this should let you add a second, independant, area in the page, that implements the same logic - possibly within a completely different layout

## option B

* keep track of the latest issue number, and disable the prev/next buttons when
  they will be ineffective
* *hint:* this might lead you to change `fetchIssue` so that it returns the current `num` in addition to displaying it

## option C

* display the issue title, date, and alternative text, in addition to its number
* any other improvement that you find useful or interesting

## option D

* let the user go directly to a specific issue by typing the number in a searchbox
