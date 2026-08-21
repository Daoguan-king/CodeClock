# CodeClock · 代码时钟壁纸

一个以「编程语言代码」为视觉风格的多语言时钟壁纸，**一切皆可自定义**。

- **34 种编程语言**：JavaScript / TypeScript / Python / Java / C / C++ / C# / Rust / SQL / PHP / Go / Kotlin / Wolfram / MATLAB / Bash / Batch / PowerShell / Lua / CSS / Gradle / JSON / XML / LaTeX / Ruby / Swift / Vue / YAML / Smalltalk / Smali / R / Visual Basic / HTML / Assembly / 易语言，时间实时跳动在代码中
- **19 套编辑器高亮主题**：Atom One Light / Dracula / GitHub Dark / GitHub Light / IntelliJ Light / JetBrains Dark (Darcula) / Material Theme / Monokai / Night Owl Dark / Night Owl Light / One Dark (Atom) / Panda Theme / Shades of Purple / Solarized Dark / Solarized Light / SynthWave '84 / VS Code Dark+ / Winter is Coming Dark / Winter is Coming Light
- **双模式**：既可作 Wallpaper Engine 壁纸，也可直接在普通浏览器中使用（带可折叠设置侧边栏 + 右键菜单）
- **高度自定义**：24 小时制、秒/日期/星期/上下午、月份格式、注释行日期格式（17 种预设含 ISO 8601 / RFC 3339 / UNIX 时间戳 / asctime，支持自定义令牌）、位置/字号/字体（6 款内置开源字体 + **自定义系统字体**，未安装自动回退 JetBrains Mono）、行号/标题栏/注释/光标、桌面背景与光晕、整体透明度
- **特效**：配置变更时平滑缩放动画、整点弹跳 + 背景闪烁（可开关）
- **纯本地**：无需联网，低资源占用；字体全部内置

---

## 作为壁纸引擎壁纸使用

订阅方式：
1. 打开 Wallpaper Engine
2. 搜索 “**CodeClock 代码时钟**”
3. 订阅

自行加载方式：
1. 打开 Wallpaper Engine
2. 点击右下角 **+ 添加壁纸** → **从文件夹中选择**
3. 选中本项目文件夹内的 `project.json` → 创建
4. 在壁纸设置面板中即可调节全部参数（由 `project.json` 驱动）


> 壁纸引擎模式下侧边栏自动隐藏，参数通过壁纸引擎自己的设置界面修改并持久化。

## 作为浏览器时钟使用

直接双击打开 `index.html`，或部署到任意静态托管（GitHub Pages 等）。

- 右上角 **齿轮按钮** 打开/折叠设置侧边栏
- 侧边栏控件与壁纸引擎参数一一对应（数据源同为 `project.json`），改动即时生效
- 设置自动保存在浏览器 `localStorage`
- **右键点击代码块**：复制当前时间 / 日期 / UNIX 时间戳、快速切换编程语言
- 侧边栏底部**配置预设**：保存/加载/删除多套方案，支持导出 JSON 文件分享、导入他人配置

> 部署到 http(s) 环境后，侧边栏会自动 `fetch("project.json")` 获取最新参数定义；直接打开本地文件时使用内置镜像定义。

## 目录结构

```
├── project.json          # 壁纸引擎配置 + 参数定义源（侧边栏数据源）
├── index.html            # 入口（含侧边栏/右键菜单容器）
├── css/sidebar.css       # 浏览器模式侧边栏与右键菜单样式
├── js/
│   ├── themes.js         # 19 套高亮主题（含光晕色）
│   ├── languages.js      # 34 种语言模板（文件头部含开发者文档）
│   ├── settings.js       # 参数定义镜像 + localStorage 持久化 + 格式转换
│   ├── sidebar.js        # 浏览器模式侧边栏（控件渲染/预设管理）
│   └── main.js           # 时钟逻辑、环境检测、渲染与特效
└── fonts/                # 内置字体（全部为 OFL 开源许可，可再分发）

> 自定义字体：代码字体下拉框选择「自定义字体…」后，输入系统已安装的字体名（如 Microsoft YaHei）即可；未安装或留空时自动回退 JetBrains Mono。
```

## 添加新编程语言

`js/languages.js` 文件头部有完整的开发者文档，按文档添加 `LANG.push({...})` 模板并在 `project.json` 的 `Language` 选项中追加一项即可，约 15 行代码。

## 添加新参数

1. 在 `project.json` 的 `general.properties` 中添加属性（`bool` / `combo` / `slider` / `color` / `textinput` / `text`）
2. 在 `main.js` 的 `applyProps()` 中读取该属性并应用到渲染逻辑
3. 侧边栏会自动生成对应控件（浏览器模式）；部署在 http(s) 时无需修改 `settings.js`

## 许可证

- 代码：**MIT License**（见 `LICENSE`）
- 内置字体均为 **SIL Open Font License (OFL)**，可自由再分发：
  JetBrains Mono / Fira Code / Ubuntu Mono / Noto Sans Mono CJK SC / IBM Plex Mono / Source Code Pro
- 如需替换/新增字体：将字体文件放入 `fonts/`，在 `index.html` 添加 `@font-face` 规则，并在 `js/main.js` 的 `FONTS` 列表与 `project.json` 的 `FontFamily` 选项中登记
- 注意：请勿将 Windows/macOS 系统专有字体（Consolas、Courier New、Lucida Console、SF Mono 等）放入仓库再分发，其 EULA 禁止再分发

## 致谢与反馈

- 欢迎提交新语言模板、新主题、新特性
- 遇到问题请提交 Issue，附上运行环境（壁纸引擎 / 浏览器）与复现步骤
