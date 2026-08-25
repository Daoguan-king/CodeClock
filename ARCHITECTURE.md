# CodeClock 架构说明（开发文档）

> 本文档由阅读源码整理而来，供后续开发使用。源码内（`js/themes.js`、`js/languages.js`、`README.md`）还自带开发者文档，改对应模块前请先看文件头注释。

## 1. 这是什么

CodeClock 是一个 **Wallpaper Engine "web" 类型壁纸**（`project.json` 中 `"type": "web"`、`"file": "index.html"`），
同时支持**双模式运行**：

| 模式 | 触发条件 | 设置入口 | 持久化 |
| --- | --- | --- | --- |
| 壁纸引擎模式 | WE 注入 `wallpaperRegisterPauseListener` / `wallpaperRequestRandomFileForProperty`，或 UA 含 "Wallpaper Engine"（见 `main.js` 的 `IS_WE`） | WE 自带的属性面板（由 `project.json` 生成） | WE 自行保存 |
| 浏览器模式 | 普通浏览器打开 `index.html` | 右侧可折叠设置侧边栏 + 代码块右键菜单 | `localStorage`（key: `codeclock.settings.v1`） |

壁纸引擎模式下 `body` 加 `in-we` 类，`css/sidebar.css` 用 `.in-we #sidebar { display:none !important }` 隐藏侧边栏。

## 2. 目录结构与职责

```
CodeClock-代码时钟/
├── project.json      # ★ 单一事实来源：WE 配置 + 全部参数定义（properties）
├── index.html        # 入口：编辑器外观 DOM + 字体 @font-face + 侧边栏/右键菜单容器
├── css/sidebar.css   # 浏览器模式侧边栏、齿轮按钮、右键菜单样式
├── js/
│   ├── themes.js     # 19 套高亮主题（THEMES 数组，含颜色与光晕色）
│   ├── languages.js  # 34 种语言模板（LANG 数组，token 化渲染）
│   ├── settings.js   # PROP_DEFS（project.json 的镜像）+ localStorage + 颜色格式转换
│   ├── sidebar.js    # 浏览器模式侧边栏：按属性定义动态生成控件 + 配置预设
│   └── main.js       # 核心：状态、时间计算、渲染循环、特效、WE API 对接
└── fonts/            # 6 款内置 OFL 字体（woff/otf）
```

> `【例子】完美壁纸/` 是仓库里的第三方参考示例（音频可视化大壁纸），与 CodeClock 无代码关联，可参考其复杂的 `project.json` 属性写法（含 option 级 `condition`、audio/particles 等）。

## 3. 核心架构：一个 JSON 驱动的三件套

整个壁纸的设计核心是 **"参数定义只有一份，三个模块消费同一份"**：

```
project.json  general.properties（参数定义 + 默认值）
        │
        ├──→ WE 属性面板（引擎直接读取，无需 JS）
        │
        ├──→ settings.js  PROP_DEFS（file:// 打开时的兜底镜像；
        │                 http(s) 下启动时 fetch("project.json") 自动同步覆盖）
        │
        └──→ sidebar.js   按定义动态生成侧边栏控件（浏览器模式）
```

### 3.1 参数类型与命名

属性支持 `bool` / `combo` / `slider` / `color` / `textinput` / `text`（分组标题），
关键字段：`type`、`value`（默认值）、`options`（combo）、`min/max`（slider）、
`condition`（如 `"DateFormat.value == 17"`，控制属性显示）、`order`（面板排序）、`text`（中英文说明）。

**重要约定（源码反复强调）**：
- `combo` 的 `value` 从 1 开始递增，**新选项只能追加，不能插队**，否则已保存的用户设置会"串味"。
- `THEMES` / `LANG` 数组下标与属性值的关系是 `value = index + 1`。
- 颜色在 WE 中存为 `"0.35 0.6 1"`（0~1 浮点，空格分隔），浏览器侧边栏需转 `#RRGGBB`：
  - `CodeClockSettings.weToHex`（WE→hex）、`hexToWe`（hex→WE）、`parseColor`（WE→rgb 数组）。

## 4. 渲染链路（数据流）

```
WE applyUserProperties / 侧边栏 onChange
        │  (形如 { Language: { value: 1 }, Theme: { value: 2 }, ... })
        ▼
main.js applyProps(properties) ──► 写入 state（全部运行时配置）
        ▼
buildTime()  ──► T：{ hour, min, sec, period, weekday, day, month, year, comment, commentBottom }
        │        （日期格式由 DATE_FMT 预设 17 种 + 自定义 token 模板渲染）
        ▼
currentCfg() ──► cfg：{ showComment, showSeconds, showPeriod, showDate, showWeekday, wdLang, monthFormat }
        ▼
LANG[language-1].render(T, cfg) ──► 行数组 lines[][]
        每行 = token 数组，token = { t: 类型, x: 文本 }
        ▼
main.js render()：
  - token → HTML：t === "" 直接 esc() 输出；否则 <span class="tok-{t}">esc(x)</span>
  - 行号 → #gutter（pre），文件名 → #tabname，主题 → #editor.className = "theme-{i}"
  - 字体/字号/位置/透明度/背景/光晕 → 内联 style
  - 尺寸变化时播放"形变"缩放动画（morph）
```

### 4.1 token 类型 ↔ 主题颜色

| token | CSS 类 | 主题字段 | 含义 |
| --- | --- | --- | --- |
| "" | — | `fg` | 纯文本 |
| com | `.tok-com` | `com` | 注释 |
| key | `.tok-key` | `key` | 关键字（加粗 600） |
| str | `.tok-str` | `str` | 字符串 |
| num | `.tok-num` | `num` | 数字 |
| typ | `.tok-typ` | `typ` | 类型/类名 |
| var | `.tok-var` | `var` | 变量/字段名 |
| pun | `.tok-pun` | `pun` | 标点 |
| fn | `.tok-fn` | `fn` | 函数名 |
| pp | `.tok-pp` | `pp` | 预处理指令（#include、<?php） |
| shb | `.tok-shb` | `shb` | shebang 整行 |

### 4.2 主题机制（themes.js + main.js buildThemeCSS）

- `THEMES` 是数组，每项 20 个 `#RRGGBB` 字段（bg/fg/gutter/gutterfg/title/tabfg/cursor/sel/com/key/str/num/typ/var/pun/fn/pp/glow/shb）。
- 启动时 `buildThemeCSS()` 遍历 THEMES，为每个主题生成一条 `.theme-N{--bg:...;--tok-com:...;}` 规则，注入 `<style id="themeCSS">`。
- 切换主题 = 切换 `#editor` 的 className；关闭高亮加 `no-hl` 类，所有 token 统一用 `--fg`。
- 主题的 `glow` 同时驱动"光晕"与"整点闪烁"颜色。

### 4.3 语言机制（languages.js）

- `LANG` 是数组，每项 `{ name, ext, render(T, cfg) }`，`ext` 显示在标题栏（如 `clock.py`）。
- 辅助函数（模板内可直接用）：
  - `line(...)`：组装一行，参数为字符串（纯文本）或 `[文本, 类型]` 二元组；
  - `fieldList(T, cfg)`：按用户开关自动生成字段列表（hour/minute/second/period/weekday/day/month/year），**顺序固定**；
  - `valueTok / numTok / strTok / strTokSql`、`commentLine(P, text)`、`cap(s)`。
- 模板约定（源码文件头有详细文档）：
  - 底部注释行必须写 `if (cfg.showComment && T.commentBottom)`（空字符串时隐藏）；
  - 24h 制下 `cfg.showPeriod` 自动为 false，`fieldList` 自动剔除 period，无需各语言单独处理；
  - Go/SQL/Wolfram/JSON 等不允许尾逗号的语法需判断 `last = f.length - 1`；
  - HTML 转义由 main.js 统一处理，模板不用管。

## 5. 时间计算（main.js）

- `buildTime()`：取当前时间，按 state 计算 hour（12/24h）、period（AM·PM/上午·下午）、
  month（名称/数字/缩写）、weekday（中/英）、comment（顶部注释）等。
- 日期格式：`DATE_FMT` 17 种预设（YYYY-MM-DD、ISO 8601、RFC 3339 UTC、UNIX 时间戳 X、asctime、自定义模板 17）。
- `renderDateTemplate(now, tpl)`：token 替换引擎，支持 `YYYY YY MMMM MMM MM M DD D dddd ddd HH H hh h mm m ss s A a Z X`。
- 含时间字段的格式（14/15/16 或自定义模板含时间 token）由 `fmtHasTime()` 判断，此时顶部注释会"实时跳动"。

## 6. 更新循环与性能

- 定时器：`setInterval(tick, 250)`。
- `tick()`：
  1. 用 `lastHourKey`（"年-月-日-时"）检测整点切换，触发 `playHourFx()`（弹跳 + 背景闪烁，均为可开关特效）；
  2. 计算 `sig = [comment, hour, min, sec, period, showSeconds, showPeriod, showDate].join("|")`；
  3. **只有 sig 变化才 render(true)**——即实际每秒最多重绘一次，250ms 轮询只是用来"不错过秒变化"。
- `render(animate)`：
  - 先记旧尺寸，写入 innerHTML 后再量新尺寸；尺寸变化且 400ms 冷却期外时，
    用 `scale(oldW/newW, oldH/newH)` 过渡实现"代码块平滑形变"（语言/主题/开关切换动画）。
- 浏览器模式下 `visibilitychange` 时停/启定时器；WE 模式由 `wallpaperRegisterPauseListener` 设置 `paused`。

## 7. Wallpaper Engine 对接（WE API 最小面）

```js
window.wallpaperPropertyListener = {
  applyUserProperties: applyProps   // 属性变化/初始化时被 WE 调用
};
if (window.wallpaperRegisterPauseListener) {
  window.wallpaperRegisterPauseListener(function (isPaused) { paused = isPaused; });
}
```

- 音频处理：`"supportsaudioprocessing": true`，注册 `window.wallpaperAudioListener.onAudioLevelsAvailable` 获取音频能量（详见第 11 节）；不需要随机文件/场景等接口。
- 所有资源用相对路径（fonts/css/js），纯本地渲染，无网络请求。

## 8. 浏览器模式（sidebar.js）

- 侧边栏控件完全由 `CodeClockSettings.defs`（PROP_DEFS）动态生成：
  `bool→checkbox`、`combo→select`、`slider→range+number 联动`、`color→color picker（hex 互转）`、`textinput→text`。
- `evalCondition` 解析 `condition` 字符串（支持 && 与 == true/false/数字/字符串）决定控件显隐。
- 改动即生效：`onChange(flat)` → `applyProps(toWeProps(flat))` → `save(flat)`（localStorage）。
- 底部"配置预设"：保存/加载/删除多套方案（localStorage `codeclock.presets.v1`），支持 JSON 导出/导入分享。
- 右键菜单（`initContextMenu`）：复制时间/日期/UNIX 时间戳、快速切换语言（直接调 `applyProps`）。

## 9. 扩展指南（三处改动的共同套路）

### 新增编程语言
1. `js/languages.js` 末尾 `LANG.push({ name, ext, render })`（参考 Elixir 示例注释）；
2. `project.json` 的 `Language.options` 追加 `{ "label": "Elixir", "value": 35 }`；
3. 若 `file://` 直开且不部署 http(s)，同步 `js/settings.js` 的 `PROP_DEFS.Language.options`。

### 新增主题
1. `js/themes.js` 末尾追加主题对象（20 个字段全填）；
2. `project.json` 的 `Theme.options` 追加 `value: 20`；
3. `file://` 场景同步 `PROP_DEFS.Theme.options`。

### 新增参数
1. `project.json` 的 `general.properties` 加属性（bool/combo/slider/color/textinput/text，含 order/condition）；
2. `js/main.js` 的 `state` 加默认值，`applyProps()` 中读取并应用到渲染；
3. 侧边栏自动生成控件（http(s) 部署时 settings.js 无需改）。

## 10. 注意事项 / 坑

- **数组下标 = value - 1**，新增只能 append；`state.language` 等默认值必须与 project.json 一致。
- `applyProps` 里对每个属性做了 `if (p.X)` 守卫，缺失的属性不会覆盖默认值——浏览器模式 localStorage 里没有的键会走默认。
- 颜色有三套表示（WE 浮点串 / hex / rgb 数组），改颜色相关代码务必分清。
- 自定义字体输入会剥离引号再拼进 font-family，未安装时回退 `CCJetBrainsMono`。
- 浏览器模式 `fetch("project.json")` 失败（file://）时静默使用内置镜像，不会报错。

## 11. 音乐律动（Music Sync）

- 设计文档：`docs/music-sync-design.md`；实现按推荐方案 A（光晕呼吸）+ B（主体脉动），方案 C（频谱条）预留接口。
- 参数（17 个：1 个分组标题 + 16 个控件）：`MusicSync`（总开关，默认 false）、`MusicSyncMode`（1 仅光晕 / 2 仅代码块 / 3 两者）、`MusicBand` + `MusicBandLow/High`（频段选择）、`MusicSensitivity`、`MusicSmooth`、`MusicBeatStyle` + `MusicBeatThreshold`、`MusicColorStyle`、`MusicGlowMin/Max`、`MusicBodyStyle`（1 字号微震 / 2 整体缩放 / 3 字号+缩放，幅度 0-200%）、`MusicBodyStrength`、`MusicIdle`、`MusicDemo`。
- 数据流：**双 API 适配**（回调内**只算数据**）→ `audioData`（raw/pulse/low/mid/high/t）→ `audioTick()` rAF 循环（attack/decay 插值平滑）→ `applyMusicVisuals()` 每帧写 boxShadow / fontSize / #wrap transform。
  - **经典 API（首选，官方示例 Rainbow Rings 即用此）**：`window.wallpaperRegisterAudioListener(cb)`，回调收到 **128 浮点数组**（`data[0..63]` 左声道 FFT、`data[64..127]` 右声道），值可能 >1 需 clamp；无 lPulse 时用帧内最大 bin 作节拍代理。
  - **对象 API（兜底）**：`window.wallpaperAudioListener.onAudioLevelsAvailable(levels)`，优先读 `v1..v63` 频段字段，否则读 `freq` 数组（前/后半分别视为左右声道）。
  - ⚠️ 历史教训：仅注册对象 API 在部分 WE 环境收不到数据（表现为完全不律动），必须双注册。
- 渲染协调：
  - `render()` 在 `state.musicSync` 为 true 时跳过 fontSize 与 boxShadow（由音乐层每帧接管）；关闭时 `resetMusicVisuals()` 清掉残留并 `render(false)` 还原静态外观。
  - 整点弹跳（#bounce transform）与音乐缩放（#wrap transform）作用于不同元素，互不冲突。
- 幅度映射（MusicBodyStrength 最高 200%，200% 时）：字号微震 ≤ +8px、整体缩放 ≤ 14%（e=1 满能量时；早期系数太弱，用户反馈"看不出律动"已加强）。
- 已移除：「背景呼吸」主体样式及其专属的 `MusicBodyColorMode`/`MusicBodyColor` 颜色参数（用户确认保留代码块效果即可）。
- 参数取值注意：`MusicSensitivity`/`MusicSmooth`/`MusicBeatThreshold`/`MusicGlowMin/Max`/`MusicBodyStrength` 等一律用 typeof 判空——值为 0 是合法取值（曾用 `x || default` 导致敏感度 0 变成 100、平滑度 0 变成 30）。
- 律动作用对象门控：`MusicSyncMode=2`（仅代码块）时音乐层不再写 boxShadow，恢复静态光晕（`applyStaticGlow()`）。
- 浏览器模式：无 WE 音频数据时能量为 0（静默静止、不报错）；`MusicDemo` 用正弦波模拟节拍便于预览。
- 侧边栏 `evalCondition()` 已升级：支持 `||`、`!=` 与括号，音乐参数的条件显隐（含 GlowEnabled 联动）可用。
