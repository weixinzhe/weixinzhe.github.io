# 我的小站 · 纯网页操作部署手册

一套**多页面**的纯静态网站（HTML + CSS + JS），全程只用 GitHub 网页界面，不需要敲任何 Git 命令。

---

## 一、文件说明

```
my-site/
├── index.html        首页
├── about.html        关于页
├── projects.html     作品页
├── contact.html      联系页
├── 404.html          页面不存在时显示的页面（可删）
├── .nojekyll         空文件，告诉 GitHub 不要用 Jekyll 处理，避免奇怪问题
├── css/
│   └── style.css     全站共用样式（改配色只改这一个文件）
└── js/
    └── main.js       全站共用脚本（导航高亮 / 年份 / 点击复制）
```

---

## 二、首次上线（约 5 分钟）

### 第 1 步：建仓库

1. 打开 https://github.com/new
2. **Repository name** 填 `你的用户名.github.io`
   > 必须和你的 GitHub 用户名完全一致，例如用户名是 `tom` 就填 `tom.github.io`。
3. 可见性选 **Public**
4. **不要**勾选 Add a README / .gitignore / license，保持空仓库
5. 点 **Create repository**

### 第 2 步：上传文件

1. 在新建好的仓库页面，点 **Add file → Upload files**
2. 打开本地文件夹 `D:\AI Switch\deepseek\my-site`
3. 把里面的**全部内容**（4 个 html + 404.html + .nojekyll + css 文件夹 + js 文件夹 + README.md）
   一起拖进网页中间的拖拽区域
4. 等文件列表出现后，点最下面的绿色 **Commit changes**

> ⚠️ 拖的是 `my-site` **里面的东西**，不要拖 `my-site` 文件夹本身，
> 否则会变成 `用户名.github.io/my-site/index.html`，网址就多一层了。
>
> ⚠️ 如果上传后仓库里看不到 `.nojekyll`（有时隐藏文件会被跳过），
> 用 **Add file → Create new file**，文件名填 `.nojekyll`，内容留空，提交即可。

### 第 3 步：开启 Pages

1. 仓库页面 → **Settings**（顶部菜单）
2. 左侧栏 → **Pages**
3. **Source** 选 `Deploy from a branch`
4. **Branch** 选 `main`，右边文件夹选 `/ (root)`，点 **Save**
5. 等 1～3 分钟，访问 `https://你的用户名.github.io`

看到首页就成功了 🎉

---

## 三、日常修改内容

全部在网页上完成：

1. 进入仓库，点要改的文件名（例如 `about.html`）
2. 点右上角的 **铅笔图标**（Edit this file）
3. 改完往下滚，点 **Commit changes**
4. 等 1 分钟左右，回到网站按 `Ctrl + F5` 强制刷新

---

## 四、以后怎么加一个新页面

1. 进入仓库 → 点开 `about.html` → 右上角铅笔右边有个 **复制/新建** 思路：
   更简单的做法是：**Add file → Create new file**，文件名填 `blog.html`
2. 把 `about.html` 的内容整体复制粘贴进去，改掉这三处：
   - `<title>` 和 `<h1>` 改成新页面的标题
   - `<main>` 里的内容换成新内容
   - 所有页面的 `<nav>` 里加一行：`<a href="blog.html">博客</a>`
     （**每个 html 文件的导航都要加**，因为没有后端，导航是各页面各写一份的）
3. 提交，等 1 分钟，访问 `https://你的用户名.github.io/blog.html`

> 小技巧：导航高亮是 `js/main.js` 自动做的，你只管加 `<a href="blog.html">`，
> 打开该页时它会自动变蓝，不用手写 class。

---

## 五、多页面的三条铁律

| 规则 | 说明 |
|---|---|
| **1. 路径永远用相对路径** | 写 `css/style.css`、`about.html`，**不要**写 `/css/style.css`、`/about.html`。相对路径以后把站点搬到别处也不会坏。 |
| **2. 入口文件必须叫 `index.html`** | 全小写。访问 `/` 时服务器默认找它，名字错了就是 404 或者直接显示源码。 |
| **3. 导航菜单要同步改所有页面** | 没有模板引擎，每个 `.html` 都自带一份 `<header>`。加了新页面记得每个文件的导航都补上链接。 |

---

## 六、常见问题

| 现象 | 原因 / 解决 |
|---|---|
| 打开是 404 | ① 仓库名不是 `用户名.github.io`；② Settings → Pages 里 Branch 没选 `main` 或没选 `/ (root)`；③ 刚开启，等 1～10 分钟；④ 仓库是 Private |
| 页面没样式（纯文字） | `style.css` 路径写错，检查是不是写成了 `/css/style.css`，或 `css` 文件夹没上传 |
| 点导航没反应 / 404 | 链接文件名拼错，或文件名大小写不一致（GitHub 服务器区分大小写，`About.html` ≠ `about.html`） |
| 中文乱码 | HTML 里要有 `<meta charset="UTF-8">`，且文件保存为 UTF-8 编码 |
| 改了不生效 | CDN 缓存，等 1～10 分钟，再按 `Ctrl + F5` |
| 手机上排版乱 | 确认每个页面都有 `<meta name="viewport" ...>`（本模板已加） |
| 想放图片 | 在仓库里建 `images` 文件夹上传图片，HTML 里写 `<img src="images/照片.jpg" alt="描述">` |

---

## 七、免费额度

- 单站大小 1 GB 以内
- 每月约 100 GB 流量
- 每小时约 10 次构建
- 只能放静态文件，**不能**跑后端（Node / PHP / 数据库都不行）

个人主页、作品集、课程作业、博客完全够用。
