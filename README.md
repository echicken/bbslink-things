# bbslink-things
BBSLink-related utilities for Synchronet BBS.

I am not affiliated with BBSLink in any way. Don't axe me no questions about it.

Execute the `scores.js` module without arguments to bring up a full-screen lightbar scores browser.

Execute the `scores.js` module with one argument (eg. `lord`) to display the score file for a particular game.  (See keys under `[games]` in `settings.ini` for a list of valid arguments.)

Example for use in a javascript command shell or module (eg. `xtrn_sec.js`):

```js
bbs.exec('?/path/to/bbslink-things/scores.js');
bbs.exec('?/path/to/bbslink-things/scores.js lord');
```
