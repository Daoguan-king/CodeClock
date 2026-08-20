(function () {
	"use strict";

	var MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var MONTHS_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var WD_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	var WD_ABBR_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	var WD_CN = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
	var WD_ABBR_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

	var FONTS = [
		["'CCJetBrainsMono', monospace", "JetBrains Mono"],
		["'CCFiraCode', monospace", "Fira Code"],
		["'CCUbuntuMono', monospace", "Ubuntu Mono"],
		["'CCNotoSansMono', monospace", "Noto Sans Mono CJK SC"],
		["'CCIBMPlexMono', monospace", "IBM Plex Mono"],
		["'CCSourceCodePro', monospace", "Source Code Pro"],
		["", "自定义字体…"]
	];

	var state = {
		language: 1,
		theme: 2,
		highlight: true,
		lineNumbers: true,
		titleBar: true,
		showComment: true,
		cursorBlink: true,
		use24: false,
		showSeconds: true,
		showDate: true,
		monthFormat: 1,
		showWeekday: true,
		wdLang: 1,
		showPeriod: true,
		periodStyle: 1,
		dateFormat: 12,
		dateFormatCustom: "YYYY-MM-DD",
		commentBottom: "CodeClock · everything is customizable",
		fontFamily: 1,
		fontCustom: "Microsoft YaHei",
		fontSize: 30,
		posX: 50,
		posY: 50,
		opacity: 100,
		bgMode: 1,
		bgColor: "0.07 0.09 0.12",
		glowEnabled: true,
		glowMode: 1,
		glowColor: "0.35 0.6 1",
		glowIntensity: 35,
		hourBounce: true,
		hourFlash: true
	};

	var editorEl, wrapEl, bounceEl, titleEl, tabEl, gutterEl, codeEl;
	var timer = null;
	var paused = false;
	var lastSig = "";
	var morphUntil = 0;
	var flashTimer = null;
	var lastHourKey = null;

	function $(id) {
		return document.getElementById(id);
	}

	function esc(s) {
		return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	function hexToRgb(hex) {
		var h = String(hex).replace("#", "");
		if (h.length === 3) {
			h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
		}
		return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
	}

	function getGlowRgb() {
		if (state.glowMode === 2) {
			return CodeClockSettings.parseColor(state.glowColor);
		}
		return hexToRgb(THEMES[state.theme - 1].glow);
	}

	function pad2(n) {
		return (n < 10 ? "0" : "") + n;
	}

	var DATE_FMT = [
		"",
		"YYYY-MM-DD",
		"DD-MM-YYYY",
		"MM-DD-YYYY",
		"YYYY/MM/DD",
		"DD/MM/YYYY",
		"MM/DD/YYYY",
		"YYYY.MM.DD",
		"YYYY年MM月DD日",
		"MM月DD日YYYY年",
		"MMMM D, YYYY",
		"MMM D, YYYY",
		"D MMMM YYYY",
		"YYYY-MM-DDTHH:mm:ssZ",
		"RFC3339UTC",
		"X",
		"asctime"
	];

	function renderDateTemplate(now, tpl) {
		var h24 = now.getHours();
		var h12 = h24 % 12 === 0 ? (h24 < 12 ? 0 : 12) : h24 % 12;
		var off = -now.getTimezoneOffset();
		var sign = off >= 0 ? "+" : "-";
		off = Math.abs(off);
		var tokens = {
			"YYYY": String(now.getFullYear()),
			"YY": pad2(now.getFullYear() % 100),
			"MMMM": MONTHS_FULL[now.getMonth()],
			"MMM": MONTHS_ABBR[now.getMonth()],
			"MM": pad2(now.getMonth() + 1),
			"M": String(now.getMonth() + 1),
			"DD": pad2(now.getDate()),
			"D": String(now.getDate()),
			"dddd": state.wdLang === 2 ? WD_CN[now.getDay()] : WD_FULL[now.getDay()],
			"ddd": state.wdLang === 2 ? WD_ABBR_CN[now.getDay()] : WD_ABBR_EN[now.getDay()],
			"HH": pad2(h24),
			"H": String(h24),
			"hh": pad2(h12),
			"h": String(h12),
			"mm": pad2(now.getMinutes()),
			"m": String(now.getMinutes()),
			"ss": pad2(now.getSeconds()),
			"s": String(now.getSeconds()),
			"A": h24 < 12 ? "AM" : "PM",
			"a": h24 < 12 ? "上午" : "下午",
			"Z": sign + pad2(Math.floor(off / 60)) + ":" + pad2(off % 60),
			"X": String(Math.floor(now.getTime() / 1000))
		};
		return tpl.replace(/(YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|A|a|Z|X)/g, function (m) {
			return tokens[m];
		});
	}

	function fmtTimeText(now) {
		var id = state.dateFormat;
		var custom = String(state.dateFormatCustom || "").trim();
		if (id === 14) {
			var u = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
			return u.getUTCFullYear() + "-" + pad2(u.getUTCMonth() + 1) + "-" + pad2(u.getUTCDate()) +
				"T" + pad2(u.getUTCHours()) + ":" + pad2(u.getUTCMinutes()) + ":" + pad2(u.getUTCSeconds()) + "Z";
		}
		if (id === 16) {
			return WD_ABBR_EN[now.getDay()] + " " + MONTHS_ABBR[now.getMonth()] + " " + pad2(now.getDate()) + " " +
				pad2(now.getHours()) + ":" + pad2(now.getMinutes()) + ":" + pad2(now.getSeconds()) + " " + now.getFullYear();
		}
		var tpl = id === 17 ? (custom || "YYYY-MM-DD") : DATE_FMT[id];
		return renderDateTemplate(now, tpl);
	}

	function fmtHasTime() {
		var id = state.dateFormat;
		if (id === 14 || id === 15 || id === 16) return true;
		var tpl = id === 17 ? String(state.dateFormatCustom || "") : DATE_FMT[id];
		return /(HH|H|hh|h|mm|m|ss|s|A|a|X)/.test(tpl);
	}

	function buildThemeCSS() {
		var css = "", i, t;
		for (i = 0; i < THEMES.length; i++) {
			t = THEMES[i];
			css += ".theme-" + i + "{--bg:" + t.bg + ";--fg:" + t.fg + ";--gutter:" + t.gutter +
				";--gutterfg:" + t.gutterfg + ";--title:" + t.title + ";--tabfg:" + t.tabfg +
				";--cursor:" + t.cursor + ";--sel:" + t.sel + ";--tok-com:" + t.com +
				";--tok-key:" + t.key + ";--tok-str:" + t.str + ";--tok-num:" + t.num +
				";--tok-typ:" + t.typ + ";--tok-var:" + t.var + ";--tok-pun:" + t.pun +
				";--tok-fn:" + t.fn + ";--tok-pp:" + t.pp + ";}";
		}
		var st = document.createElement("style");
		st.id = "themeCSS";
		st.textContent = css;
		document.head.appendChild(st);
	}

	function buildTime() {
		var now = new Date();
		var h24 = now.getHours();
		var min = now.getMinutes();
		var sec = now.getSeconds();
		var h12 = h24 % 12 === 0 ? (h24 < 12 ? 0 : 12) : h24 % 12;
		var monthNum = now.getMonth() + 1;
		var day = now.getDate();
		var year = now.getFullYear();
		var month = state.monthFormat === 1 ? MONTHS_FULL[monthNum - 1] : state.monthFormat === 3 ? MONTHS_ABBR[monthNum - 1] : String(monthNum);
		var hour = state.use24 ? h24 : h12;
		var period = h24 < 12 ? (state.periodStyle === 1 ? "AM" : "上午") : (state.periodStyle === 1 ? "PM" : "下午");
		var comment;
		if (fmtHasTime()) {
			comment = fmtTimeText(now);
		} else if (state.showDate) {
			var dt = fmtTimeText(now);
			if (state.showWeekday) {
				comment = state.wdLang === 2 ? WD_CN[now.getDay()] + " " + dt : WD_FULL[now.getDay()] + ", " + dt;
			} else {
				comment = dt;
			}
		} else {
			comment = state.showWeekday ? (state.wdLang === 2 ? WD_CN[now.getDay()] : WD_FULL[now.getDay()]) : "CodeClock · live";
		}
		return {
			hour: hour,
			min: min,
			sec: sec,
			period: period,
			weekday: state.wdLang === 2 ? WD_CN[now.getDay()] : WD_FULL[now.getDay()],
			day: day,
			month: month,
			year: year,
			comment: comment,
			commentBottom: String(state.commentBottom).replace(/^\s*(\/\/|#|--)\s*/, "").trim()
		};
	}

	function currentCfg() {
		return {
			showComment: state.showComment,
			showSeconds: state.showSeconds,
			showPeriod: !state.use24 && state.showPeriod,
			showDate: state.showDate,
			showWeekday: state.showWeekday,
			wdLang: state.wdLang,
			monthFormat: state.monthFormat
		};
	}

	function render(animate) {
		var oldW = editorEl.offsetWidth;
		var oldH = editorEl.offsetHeight;
		var T = buildTime();
		var cfg = currentCfg();
		var L = LANG[state.language - 1];
		var lines = L.render(T, cfg);
		var i, j, html = "", gutter = "", ln, tok;
		for (i = 0; i < lines.length; i++) {
			ln = lines[i];
			for (j = 0; j < ln.length; j++) {
				tok = ln[j];
				if (tok.t === "") {
					html += esc(tok.x);
				} else {
					html += '<span class="tok-' + tok.t + '">' + esc(tok.x) + "</span>";
				}
			}
			if (i < lines.length - 1) {
				html += "\n";
			}
		}
		if (state.cursorBlink) {
			html += '<span class="cursor"></span>';
		}
		codeEl.innerHTML = html;
		if (state.lineNumbers) {
			for (i = 0; i < lines.length; i++) {
				gutter += (i + 1);
				if (i < lines.length - 1) {
					gutter += "\n";
				}
			}
			gutterEl.innerHTML = gutter;
			gutterEl.style.display = "block";
		} else {
			gutterEl.style.display = "none";
		}
		tabEl.textContent = L.ext;
		titleEl.style.display = state.titleBar ? "flex" : "none";
		editorEl.className = "theme-" + (state.theme - 1) + (state.highlight ? "" : " no-hl");
		var fam;
		if (state.fontFamily === 7) {
			var custom = String(state.fontCustom || "").replace(/["']/g, "").trim();
			fam = custom ? "'" + custom + "', 'CCJetBrainsMono', monospace" : "'CCJetBrainsMono', monospace";
		} else {
			fam = FONTS[state.fontFamily - 1][0];
		}
		editorEl.style.fontFamily = fam;
		editorEl.style.fontSize = state.fontSize + "px";
		wrapEl.style.left = state.posX + "%";
		wrapEl.style.top = state.posY + "%";
		editorEl.style.opacity = state.opacity / 100;
		if (state.bgMode === 2) {
			var bgRgb = CodeClockSettings.parseColor(state.bgColor);
			document.body.style.background = "rgb(" + bgRgb.join(",") + ")";
		} else {
			document.body.style.background = THEMES[state.theme - 1].bg;
		}
		if (state.glowEnabled) {
			var glowRgb;
			if (state.glowMode === 2) {
				glowRgb = CodeClockSettings.parseColor(state.glowColor);
			} else {
				glowRgb = hexToRgb(THEMES[state.theme - 1].glow);
			}
			var ga = 0.12 + (state.glowIntensity / 100) * 0.85;
			var spread = 24 + state.glowIntensity;
			editorEl.style.boxShadow = "0 0 " + spread + "px rgba(" + glowRgb.join(",") + "," + ga.toFixed(2) + "), 0 12px 40px rgba(0,0,0,.38)";
		} else {
			editorEl.style.boxShadow = "0 12px 40px rgba(0,0,0,.38)";
		}
		var newW = editorEl.offsetWidth;
		var newH = editorEl.offsetHeight;
		if (animate && oldW > 0 && oldH > 0 && (oldW !== newW || oldH !== newH) && Date.now() >= morphUntil) {
			morphUntil = Date.now() + 400;
			editorEl.style.transition = "none";
			editorEl.style.transform = "scale(" + (oldW / newW) + "," + (oldH / newH) + ")";
			requestAnimationFrame(function () {
				void editorEl.offsetWidth;
				requestAnimationFrame(function () {
					editorEl.style.transition = "";
					editorEl.style.transform = "";
				});
			});
		}
	}

	function playHourFx() {
		if (state.hourBounce && bounceEl) {
			bounceEl.classList.remove("bounce");
			void bounceEl.offsetWidth;
			bounceEl.classList.add("bounce");
		}
		if (state.hourFlash) {
			var frgb = getGlowRgb();
			editorEl.style.backgroundColor = "rgba(" + frgb.join(",") + ",0.55)";
			clearTimeout(flashTimer);
			flashTimer = setTimeout(function () {
				editorEl.style.backgroundColor = "";
			}, 600);
		}
	}

	function applyProps(properties) {
		var p = properties;
		if (p.Language) state.language = p.Language.value;
		if (p.Theme) state.theme = p.Theme.value;
		if (p.SyntaxHighlight) state.highlight = p.SyntaxHighlight.value;
		if (p.LineNumbers) state.lineNumbers = p.LineNumbers.value;
		if (p.TitleBar) state.titleBar = p.TitleBar.value;
		if (p.ShowComment) state.showComment = p.ShowComment.value;
		if (p.CursorBlink) state.cursorBlink = p.CursorBlink.value;
		if (p.Use24Hour) state.use24 = p.Use24Hour.value;
		if (p.ShowSeconds) state.showSeconds = p.ShowSeconds.value;
		if (p.ShowDate) state.showDate = p.ShowDate.value;
		if (p.MonthFormat) state.monthFormat = p.MonthFormat.value;
		if (p.ShowWeekday) state.showWeekday = p.ShowWeekday.value;
		if (p.WeekdayLang) state.wdLang = p.WeekdayLang.value;
		if (p.ShowPeriod) state.showPeriod = p.ShowPeriod.value;
		if (p.PeriodStyle) state.periodStyle = p.PeriodStyle.value;
		if (p.DateFormat) state.dateFormat = p.DateFormat.value;
		if (p.DateFormatCustom) state.dateFormatCustom = p.DateFormatCustom.value;
		if (p.FontFamily) state.fontFamily = p.FontFamily.value;
		if (p.FontCustom) state.fontCustom = p.FontCustom.value;
		if (p.FontSize) state.fontSize = p.FontSize.value;
		if (p.PositionX) state.posX = p.PositionX.value;
		if (p.PositionY) state.posY = p.PositionY.value;
		if (p.Opacity) state.opacity = p.Opacity.value;
		if (p.BackgroundMode) state.bgMode = p.BackgroundMode.value;
		if (p.BackgroundColor) state.bgColor = p.BackgroundColor.value;
		if (p.GlowEnabled) state.glowEnabled = p.GlowEnabled.value;
		if (p.GlowMode) state.glowMode = p.GlowMode.value;
		if (p.GlowColor) state.glowColor = p.GlowColor.value;
		if (p.GlowIntensity) state.glowIntensity = p.GlowIntensity.value;
		if (p.HourBounce) state.hourBounce = p.HourBounce.value;
		if (p.HourFlash) state.hourFlash = p.HourFlash.value;
		if (p.BottomComment) state.commentBottom = p.BottomComment.value;
		render(true);
	}

	function tick() {
		if (paused) return;
		var now = new Date();
		var hk = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + "-" + now.getHours();
		if (lastHourKey !== null && hk !== lastHourKey && now.getMinutes() === 0) {
			playHourFx();
		}
		lastHourKey = hk;
		var T = buildTime();
		var sig = [T.comment, T.hour, T.min, T.sec, T.period, state.showSeconds, state.showPeriod, state.showDate].join("|");
		if (sig !== lastSig) {
			lastSig = sig;
			render(true);
		}
	}

	window.wallpaperPropertyListener = {
		applyUserProperties: applyProps
	};

	if (window.wallpaperRegisterPauseListener) {
		window.wallpaperRegisterPauseListener(function (isPaused) {
			paused = isPaused;
		});
	}

	var IS_WE = typeof window.wallpaperRegisterPauseListener === "function" ||
		typeof window.wallpaperRequestRandomFileForProperty === "function" ||
		/Wallpaper Engine/i.test(navigator.userAgent || "");

	function copyText(s) {
		var ta = document.createElement("textarea");
		ta.value = s;
		ta.style.position = "fixed";
		ta.style.opacity = "0";
		document.body.appendChild(ta);
		ta.select();
		try {
			document.execCommand("copy");
		} catch (e) {}
		document.body.removeChild(ta);
	}

	function initContextMenu() {
		var menu = $("ctxmenu");
		if (!menu) return;
		document.getElementById("editor").addEventListener("contextmenu", function (e) {
			e.preventDefault();
			var T = buildTime();
			var cfg = currentCfg();
			var timeText = T.hour + ":" + pad2(T.min) + ":" + pad2(T.sec) + (cfg.showPeriod ? " " + T.period : "");
			var items = [
				{ head: "时间与日期" },
				{ label: "复制时间 " + timeText, act: function () { copyText(timeText); } },
				{ label: "复制日期 " + T.comment, act: function () { copyText(T.comment); } },
				{ label: "复制时间与日期", act: function () { copyText(T.comment + " " + timeText); } },
				{ label: "复制 UNIX 时间戳", act: function () { copyText(String(Math.floor(Date.now() / 1000))); } },
				{ sep: true },
				{ head: "切换编程语言" }
			];
			LANG.forEach(function (l, i) {
				items.push({
					label: (i + 1 === state.language ? "✓ " : "") + l.name,
					act: function () { applyProps({ Language: { value: i + 1 } }); }
				});
			});
			var html = "";
			for (var i = 0; i < items.length; i++) {
				var it = items[i];
				if (it.sep) html += '<div class="mi-sep"></div>';
				else if (it.head) html += '<div class="mi-head">' + it.head + "</div>";
				else html += '<div class="mi" data-idx="' + i + '">' + it.label + "</div>";
			}
			menu.innerHTML = html;
			menu.style.display = "block";
			menu.style.left = Math.min(e.clientX, Math.max(8, window.innerWidth - menu.offsetWidth - 8)) + "px";
			menu.style.top = Math.min(e.clientY, Math.max(8, window.innerHeight - menu.offsetHeight - 8)) + "px";
			var rows = menu.querySelectorAll(".mi");
			for (var j = 0; j < rows.length; j++) {
				rows[j].addEventListener("click", function () {
					var idx = parseInt(this.getAttribute("data-idx"), 10);
					items[idx].act();
					menu.style.display = "none";
				});
			}
		});
		document.addEventListener("click", function () {
			menu.style.display = "none";
		});
		document.addEventListener("contextmenu", function (e) {
			if (e.target.closest && !e.target.closest("#editor")) menu.style.display = "none";
		});
	}

	function startTimer() {
		if (!timer) {
			timer = setInterval(tick, 250);
		}
	}

	function stopTimer() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	function init() {
		editorEl = $("editor");
		wrapEl = $("wrap");
		bounceEl = $("bounce");
		titleEl = $("titlebar");
		tabEl = $("tabname");
		gutterEl = $("gutter");
		codeEl = $("code");
		buildThemeCSS();
		render(false);
		if (IS_WE) {
			document.body.classList.add("in-we");
		} else {
			document.addEventListener("visibilitychange", function () {
				if (document.hidden) {
					stopTimer();
				} else {
					startTimer();
				}
			});
			CodeClockSettings.fetchDefs(function () {
				var flat = CodeClockSettings.load();
				applyProps(CodeClockSettings.toWeProps(flat));
				CodeClockSidebar.init(flat, function (newFlat) {
					applyProps(CodeClockSettings.toWeProps(newFlat));
					CodeClockSettings.save(newFlat);
				});
				initContextMenu();
			});
		}
		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(function () {
				render(false);
			});
		}
		startTimer();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();

