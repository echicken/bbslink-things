load('sbbsdefs.js');
load('http.js');
load('frame.js');
load('tree.js');

function get_settings() {
	const f = new File(js.exec_dir + 'settings.ini');
	f.open('r');
	const settings = f.iniGetObject();
	settings.games = f.iniGetObject('games');
	f.close();
	return settings;
}

function get_ansi_cache(code, ttl) {
	const cache_dir = js.exec_dir + '.cache';
	const cache_file = backslash(cache_dir) + code;
	if (file_isdir(cache_dir)) {
		if (file_exists(cache_file) && time() - file_date(cache_file) < ttl) {
			log(LOG_DEBUG, 'Loading ' + cache_file);
			const f = new File(cache_file);
			f.open('r');
			const ans = f.read();
			f.close();
			return ans;
		}
	}
}

function get_ansi_http(base_url, code) {
	const url = format('%s?type=ansi&door=%s', base_url, code);
	const http = new HTTPRequest();
	try {
		log(LOG_DEBUG, 'Fetching ' + url);
		const ans = http.Get(url);
		const cache_dir = js.exec_dir + '.cache';
		if (!file_isdir(cache_dir)) mkdir(cache_dir);
		const cache_file = backslash(cache_dir) + code;
		const f = new File(cache_file);
		f.open('w');
		f.write(ans);
		f.close();
		return ans;
	} catch (err) {
		log(LOG_ERR, 'Failed to fetch ' + url);
	}
}

function get_ansi(code, base_url, ttl) {
	var ans = get_ansi_cache(code, ttl);
	return ans ? ans : get_ansi_http(base_url, code);
}

function display_ansi(code, base_url, ttl) {
	const ans = get_ansi(code, base_url, ttl);
	if (!ans) return;
	console.clear(BG_BLACK|LIGHTGRAY);
	console.putmsg(ans);
	console.pause();
}

Frame.prototype.drawBorder = function(color) {
	var theColor = color;
	if (Array.isArray(color)) {
		var sectionLength = Math.round(this.width / color.length);
	}
	this.pushxy();
	for (var y = 1; y <= this.height; y++) {
		for (var x = 1; x <= this.width; x++) {
			if (x > 1 && x < this.width && y > 1 && y < this.height) continue;
			var msg;
			this.gotoxy(x, y);
			if (y == 1 && x == 1) {
				msg = ascii(218);
			} else if (y == 1 && x == this.width) {
				msg = ascii(191);
			} else if (y == this.height && x == 1) {
				msg = ascii(192);
			} else if (y == this.height && x == this.width) {
				msg = ascii(217);
			} else if (x == 1 || x == this.width) {
				msg = ascii(179);
			} else {
				msg = ascii(196);
			}
			if (Array.isArray(color)) {
				if (x == 1) {
					theColor = color[0];
				} else if (x % sectionLength == 0 && x < this.width) {
					theColor = color[x / sectionLength];
				} else if (x == this.width) {
					theColor = color[color.length - 1];
				}
			}
			this.putmsg(msg, theColor);
		}
	}
	this.popxy();
}

const attr = console.attributes;
const settings = get_settings();

if (typeof argv[0] != 'undefined') {

	display_ansi(argv[0], settings.score_url, settings.cache_ttl);

} else {

	const sys_stat = bbs.sys_status;
	bbs.sys_status|=(SS_MOFF|SS_PAUSEON);
	bbs.sys_status&=(~SS_PAUSEOFF);

	const frame = new Frame(
		1,
		1,
		console.screen_columns,
		console.screen_rows,
		BG_BLACK|LIGHTGRAY
	);
	if (settings.header && settings.header_rows) {
        frame.height -= settings.header_rows;
        frame.y += settings.header_rows;
        var header_frame = new Frame(
            1,
			1,
			frame.width,
			settings.header_rows,
			BG_BLACK|LIGHTGRAY,
			frame
        );
    }
	const tree_frame = new Frame(
		frame.x + 1,
		frame.y + 1,
		frame.width - 2,
		frame.height - 2,
		BG_BLACK|LIGHTGRAY,
		frame
	);
	frame.drawBorder([LIGHTBLUE, CYAN, LIGHTCYAN, WHITE]);
	frame.gotoxy(frame.width - 20, 1);
	frame.putmsg(ascii(180) + "\1h\1wBBSLink Scores" + ascii(195));
	frame.open();
	if (typeof header_frame !=  'undefined') {
		header_frame.load(settings.header);
	}

	const tree = new Tree(tree_frame);
	Object.keys(settings.games).forEach(
		function (e) {
			tree.addItem(
				settings.games[e], function () {
					display_ansi(e, settings.score_url, settings.cache_ttl);
					frame.invalidate();
				}
			);
		}
	);
	tree.open();

	var i;
	while (i !== 'Q') {
		frame.cycle();
		i = console.getkey().toUpperCase();
		tree.getcmd(i);
	}

	bbs.sys_status = sys_stat;

}

console.clear(attr);
