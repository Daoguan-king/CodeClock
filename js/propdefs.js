/* ============================================================================
 * CodeClock · propdefs.js
 * PROP_DEFS：project.json 的 general.properties 镜像（纯数据，无逻辑）。
 * 直接以 file:// 打开 index.html 时无法请求 project.json，用这份数据兜底；
 * 部署到 http(s) 环境后 settings.js 会自动拉取 project.json 覆盖本表。
 * 新增/修改属性：改 project.json 即可（http(s) 部署无需动此文件；
 * 若需支持 file:// 直开，再同步镜像到这里）。
 * ============================================================================ */
var PROP_DEFS = {
	"AboutInfo": {
		"index": 36,
		"order": 136,
		"text": "<small>CodeClock v1.4.0 · 多语言代码时钟壁纸<br/>34 种编程语言 · 19 套高亮主题 · 一切皆可自定义<br/>日期格式：YYYY-MM-DD / DD-MM-YYYY / MM-DD-YYYY 等 17 种预设，支持自定义令牌格式，进阶格式含 ISO 8601 / RFC 3339 / UNIX 时间戳 / ANSI C asctime()<br/>特效：配置变更时代码块平滑缩放动画；整点弹跳 + 背景闪烁；音乐律动（v1.4.0 新增）：光晕呼吸 + 主体（字号微震/整体缩放）随音乐节拍脉动，支持频段选择、敏感度、平滑度、节奏风格、律动色彩模式、光晕强度上下限、主体律动幅度（最高 200%）等 16 项参数；壁纸引擎模式专属，浏览器可开演示模式预览。<br/>6 款等宽字体内置在壁纸 fonts 文件夹（均为 OFL 开源许可），另支持自定义系统字体，未安装自动回退 JetBrains Mono。<br/>纯本地渲染，无需联网，低资源占用。<br/>A code-style clock wallpaper written in 34 programming languages with 19 editor themes. Everything is customizable!</small><br/>",
		"type": "text"
	},
	"BackgroundColor": {
		"condition": "BackgroundMode.value == 2",
		"index": 30,
		"order": 130,
		"text": "<br />桌面背景颜色<br />Desktop Background Color<br />",
		"type": "color",
		"value": "0.07 0.09 0.12"
	},
	"BackgroundMode": {
		"index": 29,
		"options": [
			{
				"label": "跟随主题",
				"value": 1
			},
			{
				"label": "自定义颜色",
				"value": 2
			}
		],
		"order": 129,
		"text": "<br />桌面背景模式<br />Desktop Background Mode<br /><small>修改最底层桌面背景，而非代码块背景</small><br />",
		"type": "combo",
		"value": 1
	},
	"BottomComment": {
		"index": 9,
		"order": 109,
		"text": "<br />底部注释文字<br />Bottom Comment Text<br /><small>留空则不显示；无需手动输入注释符号(// # --)</small><br />",
		"type": "textinput",
		"value": "CodeClock · everything is customizable"
	},
	"CursorBlink": {
		"index": 8,
		"order": 108,
		"text": "<br />光标闪烁<br />Cursor Blink<br />",
		"type": "bool",
		"value": true
	},
	"DateFormat": {
		"index": 15,
		"options": [
			{
				"label": "YYYY-MM-DD",
				"value": 1
			},
			{
				"label": "DD-MM-YYYY",
				"value": 2
			},
			{
				"label": "MM-DD-YYYY",
				"value": 3
			},
			{
				"label": "YYYY/MM/DD",
				"value": 4
			},
			{
				"label": "DD/MM/YYYY",
				"value": 5
			},
			{
				"label": "MM/DD/YYYY",
				"value": 6
			},
			{
				"label": "YYYY.MM.DD",
				"value": 7
			},
			{
				"label": "YYYY年MM月DD日",
				"value": 8
			},
			{
				"label": "MM月DD日YYYY年",
				"value": 9
			},
			{
				"label": "August 19, 2026",
				"value": 10
			},
			{
				"label": "Aug 19, 2026",
				"value": 11
			},
			{
				"label": "19 August 2026",
				"value": 12
			},
			{
				"label": "ISO 8601",
				"value": 13
			},
			{
				"label": "RFC 3339 UTC",
				"value": 14
			},
			{
				"label": "UNIX 时间戳",
				"value": 15
			},
			{
				"label": "ANSI C asctime()格式",
				"value": 16
			},
			{
				"label": "自定义格式",
				"value": 17
			}
		],
		"order": 115,
		"text": "<br />注释行日期格式<br />Date Format<br /><small>应用于顶部注释行；含时间的格式(ISO/RFC/UNIX/asctime)将实时显示时间</small><br />",
		"type": "combo",
		"value": 12
	},
	"DateFormatCustom": {
		"condition": "DateFormat.value == 17",
		"index": 16,
		"order": 116,
		"text": "<br />自定义日期格式<br />Custom Date Format<br /><small>令牌：YYYY 年 / YY 两位年 / MMMM 月份全称 / MMM 月份缩写 / MM 两位月 / M 月 / DD 两位日 / D 日 / dddd 星期全称 / ddd 星期缩写 / HH 24时 / hh 12时 / mm 分 / ss 秒 / A AM·PM / a 上午·下午 / Z 时区偏移 / X UNIX时间戳<br/>示例：YYYY年MM月DD日、DD/MM/YYYY HH:mm:ss、YYYY-MM-DD (ddd)<br/>留空回退 YYYY-MM-DD</small><br />",
		"type": "textinput",
		"value": "YYYY-MM-DD"
	},
	"FontFamily": {
		"index": 24,
		"options": [
			{
				"label": "JetBrains Mono",
				"value": 1
			},
			{
				"label": "Fira Code",
				"value": 2
			},
			{
				"label": "Ubuntu Mono",
				"value": 3
			},
			{
				"label": "Noto Sans Mono CJK SC",
				"value": 4
			},
			{
				"label": "IBM Plex Mono",
				"value": 5
			},
			{
				"label": "Source Code Pro",
				"value": 6
			},
			{
				"label": "自定义字体…",
				"value": 7
			}
		],
		"order": 124,
		"text": "<br />代码字体<br />Font Family<br /><small>内置字体均为 OFL 开源许可；选择“自定义字体…”可输入系统已安装的字体名</small><br />",
		"type": "combo",
		"value": 1
	},
	"FontCustom": {
		"condition": "FontFamily.value == 7",
		"index": 37,
		"order": 124.5,
		"text": "<br />自定义字体名称<br />Custom Font Name<br /><small>输入系统已安装的字体名，如 Microsoft YaHei / HarmonyOS Sans SC / SimSun；未安装或留空将自动回退 JetBrains Mono</small><br />",
		"type": "textinput",
		"value": "Microsoft YaHei"
	},
	"FontSize": {
		"index": 25,
		"max": 72,
		"min": 12,
		"order": 125,
		"text": "<br />字号(px)<br />Font Size(px)<br />",
		"type": "slider",
		"value": 30
	},
	"GlowColor": {
		"condition": "GlowEnabled.value == true && GlowMode.value == 2",
		"index": 33,
		"order": 133,
		"text": "<br />光晕颜色<br />Glow Color<br />",
		"type": "color",
		"value": "0.35 0.6 1"
	},
	"GlowEnabled": {
		"index": 31,
		"order": 131,
		"text": "<br />代码块光晕<br />Code Block Glow<br />",
		"type": "bool",
		"value": true
	},
	"GlowIntensity": {
		"condition": "GlowEnabled.value == true",
		"index": 34,
		"max": 100,
		"min": 0,
		"order": 134,
		"text": "<br />光晕强度<br />Glow Intensity<br />",
		"type": "slider",
		"value": 35
	},
	"GlowMode": {
		"condition": "GlowEnabled.value == true",
		"index": 32,
		"options": [
			{
				"label": "跟随主题",
				"value": 1
			},
			{
				"label": "自定义颜色",
				"value": 2
			}
		],
		"order": 132,
		"text": "<br />光晕颜色模式<br />Glow Color Mode<br />",
		"type": "combo",
		"value": 1
	},
	"HourBounce": {
		"index": 21,
		"order": 121,
		"text": "<br />整点弹跳<br />Hourly Bounce Effect<br />",
		"type": "bool",
		"value": true
	},
	"HourFlash": {
		"index": 22,
		"order": 122,
		"text": "<br />整点背景闪烁<br />Hourly Background Flash<br /><small>闪烁颜色跟随光晕颜色</small><br />",
		"type": "bool",
		"value": true
	},
	"Language": {
		"index": 2,
		"options": [
			{
				"label": "JavaScript",
				"value": 1
			},
			{
				"label": "TypeScript",
				"value": 2
			},
			{
				"label": "Python",
				"value": 3
			},
			{
				"label": "Java",
				"value": 4
			},
			{
				"label": "C",
				"value": 5
			},
			{
				"label": "C++",
				"value": 6
			},
			{
				"label": "C#",
				"value": 7
			},
			{
				"label": "Rust",
				"value": 8
			},
			{
				"label": "SQL",
				"value": 9
			},
			{
				"label": "PHP",
				"value": 10
			},
			{
				"label": "Go",
				"value": 11
			},
			{
				"label": "Kotlin",
				"value": 12
			},
			{
				"label": "Wolfram",
				"value": 13
			},
			{
				"label": "MATLAB",
				"value": 14
			},
			{
				"label": "Bash",
				"value": 15
			},
			{
				"label": "Batch",
				"value": 16
			},
			{
				"label": "PowerShell",
				"value": 17
			},
			{
				"label": "Lua",
				"value": 18
			},
			{
				"label": "CSS",
				"value": 19
			},
			{
				"label": "Gradle",
				"value": 20
			},
			{
				"label": "JSON",
				"value": 21
			},
			{
				"label": "XML",
				"value": 22
			},
			{
				"label": "LaTeX",
				"value": 23
			},
			{
				"label": "Ruby",
				"value": 24
			},
			{
				"label": "Swift",
				"value": 25
			},
			{
				"label": "Vue",
				"value": 26
			},
			{
				"label": "YAML",
				"value": 27
			},
			{
				"label": "Smalltalk",
				"value": 28
			},
			{
				"label": "Smali",
				"value": 29
			},
			{
				"label": "R",
				"value": 30
			},
			{
				"label": "Visual Basic",
				"value": 31
			},
			{
				"label": "HTML",
				"value": 32
			},
			{
				"label": "Assembly",
				"value": 33
			},
			{
				"label": "易语言",
				"value": 34
			}
		],
		"order": 102,
		"text": "<br />编程语言<br />Language<br />",
		"type": "combo",
		"value": 1
	},
	"LineNumbers": {
		"index": 5,
		"order": 105,
		"text": "<br />显示行号<br />Line Numbers<br />",
		"type": "bool",
		"value": true
	},
	"MonthFormat": {
		"condition": "ShowDate.value == true",
		"index": 14,
		"options": [
			{
				"label": "名称 (August)",
				"value": 1
			},
			{
				"label": "数字 (8)",
				"value": 2
			},
			{
				"label": "缩写 (Aug)",
				"value": 3
			}
		],
		"order": 114,
		"text": "<br />月份格式<br />Month Format<br />",
		"type": "combo",
		"value": 1
	},
	"Opacity": {
		"index": 28,
		"max": 100,
		"min": 0,
		"order": 128,
		"text": "<br />整体透明度<br />Opacity<br />",
		"type": "slider",
		"value": 100
	},
	"PeriodStyle": {
		"condition": "Use24Hour.value == false",
		"index": 20,
		"options": [
			{
				"label": "AM / PM",
				"value": 1
			},
			{
				"label": "上午 / 下午",
				"value": 2
			}
		],
		"order": 120,
		"text": "<br />上下午样式<br />Period Style<br />",
		"type": "combo",
		"value": 1
	},
	"PositionX": {
		"index": 26,
		"max": 100,
		"min": 0,
		"order": 126,
		"text": "<br />位置-X(%)(屏幕中心为50)<br />Position-X(%)(50=center)<br />",
		"type": "slider",
		"value": 50
	},
	"PositionY": {
		"index": 27,
		"max": 100,
		"min": 0,
		"order": 127,
		"text": "<br />位置-Y(%)(屏幕中心为50)<br />Position-Y(%)(50=center)<br />",
		"type": "slider",
		"value": 50
	},
	"ShowComment": {
		"index": 7,
		"order": 107,
		"text": "<br />显示装饰注释<br />Decorative Comments<br />",
		"type": "bool",
		"value": true
	},
	"ShowDate": {
		"index": 13,
		"order": 113,
		"text": "<br />显示日期(日/月/年字段)<br />Show Date<br />",
		"type": "bool",
		"value": true
	},
	"ShowPeriod": {
		"condition": "Use24Hour.value == false",
		"index": 19,
		"order": 119,
		"text": "<br />显示上下午<br />Show AM/PM<br />",
		"type": "bool",
		"value": true
	},
	"ShowSeconds": {
		"index": 12,
		"order": 112,
		"text": "<br />显示秒<br />Show Seconds<br />",
		"type": "bool",
		"value": true
	},
	"ShowWeekday": {
		"condition": "ShowDate.value == true",
		"index": 17,
		"order": 117,
		"text": "<br />显示星期<br />Show Weekday<br /><small>纯日期格式下拼接到注释行；自定义格式已含 dddd/ddd 时建议关闭</small><br />",
		"type": "bool",
		"value": true
	},
	"SyntaxHighlight": {
		"index": 4,
		"order": 104,
		"text": "<br />启用语法高亮<br />Syntax Highlight<br />",
		"type": "bool",
		"value": true
	},
	"Text_About": {
		"index": 35,
		"order": 135,
		"text": "<br/><h4>●  关于(About)</h4>",
		"type": "text"
	},
	"Text_Code": {
		"index": 1,
		"order": 101,
		"text": "<br/><h4>●  代码选项(Code Options)</h4><small>选择编程语言与高亮主题，切换时有平滑过渡动画</small><br/>",
		"type": "text"
	},
	"Text_Header": {
		"index": 0,
		"order": 100,
		"text": "<br/><h4>●  CodeClock · 代码时钟</h4><small>一切皆可自定义的编程语言时钟壁纸。<br/>34 种编程语言 × 19 套高亮主题 × 全自定义。<br/>A code-style clock wallpaper. Everything is customizable!</small><br/>",
		"type": "text"
	},
	"Text_Look": {
		"index": 23,
		"order": 123,
		"text": "<br/><h4>●  外观选项(Appearance Options)</h4><small>桌面背景、代码块光晕、位置、大小、字体与透明度</small><br/>",
		"type": "text"
	},
	"Text_Time": {
		"index": 10,
		"order": 110,
		"text": "<br/><h4>●  时间选项(Time Options)</h4><small>控制时钟显示的内容与格式</small><br/>",
		"type": "text"
	},
	"Theme": {
		"index": 3,
		"options": [
			{
				"label": "Atom One Light",
				"value": 1
			},
			{
				"label": "Dracula",
				"value": 2
			},
			{
				"label": "GitHub Dark",
				"value": 3
			},
			{
				"label": "GitHub Light",
				"value": 4
			},
			{
				"label": "IntelliJ Light",
				"value": 5
			},
			{
				"label": "JetBrains Dark (Darcula)",
				"value": 6
			},
			{
				"label": "Material Theme",
				"value": 7
			},
			{
				"label": "Monokai",
				"value": 8
			},
			{
				"label": "Night Owl Dark",
				"value": 9
			},
			{
				"label": "Night Owl Light",
				"value": 10
			},
			{
				"label": "One Dark (Atom)",
				"value": 11
			},
			{
				"label": "Panda Theme",
				"value": 12
			},
			{
				"label": "Shades of Purple",
				"value": 13
			},
			{
				"label": "Solarized Dark",
				"value": 14
			},
			{
				"label": "Solarized Light",
				"value": 15
			},
			{
				"label": "SynthWave '84",
				"value": 16
			},
			{
				"label": "VS Code Dark+",
				"value": 17
			},
			{
				"label": "Winter is Coming Dark",
				"value": 18
			},
			{
				"label": "Winter is Coming Light",
				"value": 19
			}
		],
		"order": 103,
		"text": "<br />高亮主题<br />Highlight Theme<br />",
		"type": "combo",
		"value": 2
	},
	"TitleBar": {
		"index": 6,
		"order": 106,
		"text": "<br />显示标题栏<br />Editor Title Bar<br />",
		"type": "bool",
		"value": true
	},
	"Use24Hour": {
		"index": 11,
		"order": 111,
		"text": "<br />24 小时制<br />24-Hour Format<br />",
		"type": "bool",
		"value": false
	},
	"WeekdayLang": {
		"condition": "ShowDate.value == true && ShowWeekday.value == true",
		"index": 18,
		"options": [
			{
				"label": "英文 (Wednesday)",
				"value": 1
			},
			{
				"label": "中文 (星期三)",
				"value": 2
			}
		],
		"order": 118,
		"text": "<br />星期语言<br />Weekday Language<br />",
		"type": "combo",
		"value": 1
	},
	"Text_Music": {
		"index": 38,
		"order": 134.5,
		"text": "<br/><h4>●  音乐律动(Music Sync)</h4><small>代码块光晕与主体跟随音乐律动；壁纸引擎模式读取系统音频，浏览器模式可开启演示模式预览</small><br/>",
		"type": "text"
	},
	"MusicSync": {
		"index": 39,
		"order": 134.51,
		"text": "<br />音乐律动<br />Music Sync<br /><small>代码块光晕/主体跟随音乐律动；壁纸引擎模式读取系统音频</small><br />",
		"type": "bool",
		"value": false
	},
	"MusicSyncMode": {
		"condition": "MusicSync.value == true",
		"index": 40,
		"options": [
			{ "label": "仅光晕 Glow", "value": 1 },
			{ "label": "仅代码块 Body", "value": 2 },
			{ "label": "光晕+代码块 Both", "value": 3 }
		],
		"order": 134.52,
		"text": "<br />律动作用对象<br />Sync Target<br />",
		"type": "combo",
		"value": 1
	},
	"MusicBand": {
		"condition": "MusicSync.value == true",
		"index": 41,
		"options": [
			{ "label": "低频(鼓点) Bass", "value": 1 },
			{ "label": "中频(人声) Mid", "value": 2 },
			{ "label": "高频(打击乐) Treble", "value": 3 },
			{ "label": "全频 Full", "value": 4 },
			{ "label": "自定义 Custom", "value": 5 }
		],
		"order": 134.53,
		"text": "<br />响应频段<br />Frequency Band<br /><small>低频=鼓点，中频=人声，高频=打击乐</small><br />",
		"type": "combo",
		"value": 1
	},
	"MusicBandLow": {
		"condition": "MusicSync.value == true && MusicBand.value == 5",
		"index": 42,
		"max": 63,
		"min": 1,
		"order": 134.54,
		"text": "<br />自定义频段-低界<br />Custom Band Low<br />",
		"type": "slider",
		"value": 1
	},
	"MusicBandHigh": {
		"condition": "MusicSync.value == true && MusicBand.value == 5",
		"index": 43,
		"max": 63,
		"min": 1,
		"order": 134.55,
		"text": "<br />自定义频段-高界<br />Custom Band High<br />",
		"type": "slider",
		"value": 20
	},
	"MusicSensitivity": {
		"condition": "MusicSync.value == true",
		"index": 44,
		"max": 200,
		"min": 0,
		"order": 134.56,
		"text": "<br />敏感度(%)<br />Sensitivity(%)<br /><small>100% 原样，200% 翻倍；音量小的系统可调高</small><br />",
		"type": "slider",
		"value": 100
	},
	"MusicSmooth": {
		"condition": "MusicSync.value == true",
		"index": 45,
		"max": 100,
		"min": 0,
		"order": 134.57,
		"text": "<br />平滑度(%)<br />Smoothness(%)<br /><small>0 最跟手，100 最顺滑</small><br />",
		"type": "slider",
		"value": 30
	},
	"MusicBeatStyle": {
		"condition": "MusicSync.value == true",
		"index": 46,
		"options": [
			{ "label": "平滑呼吸 Smooth", "value": 1 },
			{ "label": "鼓点脉冲 Pulse", "value": 2 },
			{ "label": "节拍闪烁 Flash", "value": 3 },
			{ "label": "频段跳跃 Band Hop", "value": 4 }
		],
		"order": 134.58,
		"text": "<br />节奏风格<br />Beat Style<br />",
		"type": "combo",
		"value": 1
	},
	"MusicBeatThreshold": {
		"condition": "MusicSync.value == true && MusicBeatStyle.value == 3",
		"index": 47,
		"max": 100,
		"min": 1,
		"order": 134.59,
		"text": "<br />节拍触发阈值(%)<br />Beat Threshold(%)<br />",
		"type": "slider",
		"value": 40
	},
	"MusicColorStyle": {
		"condition": "MusicSync.value == true",
		"index": 48,
		"options": [
			{ "label": "固定颜色 Fixed", "value": 1 },
			{ "label": "频段色相渐变 Hue Flow", "value": 2 },
			{ "label": "节拍染色 Beat Tint", "value": 3 }
		],
		"order": 134.6,
		"text": "<br />律动色彩模式<br />Sync Color Style<br />",
		"type": "combo",
		"value": 1
	},
	"MusicGlowMin": {
		"condition": "MusicSync.value == true && GlowEnabled.value == true && (MusicSyncMode.value == 1 || MusicSyncMode.value == 3)",
		"index": 49,
		"max": 100,
		"min": 0,
		"order": 134.61,
		"text": "<br />光晕最低强度(%)<br />Glow Min(%)<br />",
		"type": "slider",
		"value": 0
	},
	"MusicGlowMax": {
		"condition": "MusicSync.value == true && GlowEnabled.value == true && (MusicSyncMode.value == 1 || MusicSyncMode.value == 3)",
		"index": 50,
		"max": 200,
		"min": 0,
		"order": 134.62,
		"text": "<br />光晕峰值强度(%)<br />Glow Max(%)<br /><small>可超过 100% 让峰值比静态光晕更亮</small><br />",
		"type": "slider",
		"value": 100
	},
	"MusicBodyStyle": {
		"condition": "MusicSync.value == true && (MusicSyncMode.value == 2 || MusicSyncMode.value == 3)",
		"index": 51,
		"options": [
			{ "label": "字号微震 Font Shake", "value": 1 },
			{ "label": "整体缩放 Scale", "value": 2 },
			{ "label": "字号+缩放 Both", "value": 3 }
		],
		"order": 134.63,
		"text": "<br />主体律动样式<br />Body Style<br /><small>幅度由「主体律动幅度」控制，最高 200%</small><br />",
		"type": "combo",
		"value": 1
	},
	"MusicBodyStrength": {
		"condition": "MusicSync.value == true && (MusicSyncMode.value == 2 || MusicSyncMode.value == 3)",
		"index": 52,
		"max": 200,
		"min": 0,
		"order": 134.64,
		"text": "<br />主体律动幅度(%)<br />Body Strength(%)<br /><small>100% 为基准，最高 200% 增强效果</small><br />",
		"type": "slider",
		"value": 50
	},
	"MusicIdle": {
		"condition": "MusicSync.value == true",
		"index": 55,
		"order": 134.67,
		"text": "<br />无音乐自动静止<br />Idle Reset<br /><small>静音/暂停时视觉回落到基线；关闭则保持最后状态</small><br />",
		"type": "bool",
		"value": true
	},
	"MusicDemo": {
		"condition": "MusicSync.value == true",
		"index": 56,
		"order": 134.68,
		"text": "<br />演示模式(浏览器预览)<br />Demo Mode<br /><small>无音频数据时用模拟节拍预览效果</small><br />",
		"type": "bool",
		"value": false
	},
	"schemecolor": {
		"order": 0,
		"text": "ui_browse_properties_scheme_color",
		"type": "color",
		"value": "0 0 0"
	}
};
