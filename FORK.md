# Fork 说明

这是 [`@canary-builds/dsh-mobile-ui`](https://github.com/Canary-Builds/dsh-mobile-ui) `1.1.2` 的本地 fork，包名改为 `@local/dsh-mobile-ui`，用于在 DeepSeek Harness 的 web profile 中加载。

上游为 MIT 许可，本 fork 沿用同一许可，原版权归 Canary Builds 所有。

## 相对上游的改动

### 1. 修复折叠侧边栏时顶栏右侧按钮被截断

**文件**：`lib/client.js`

上游有一条规则：

```css
[data-sidebar-collapsed] .wSkVaW_header{padding-left:50px;padding-right:0}
```

DSH 顶栏最右侧的按钮（`.wSkVaW_headerCorner > ._1kL45W_button`）自带 `margin-right:-16px`，作用是抵消 header 自身的 `padding-right`，让按钮贴住屏幕右边缘。把 `padding-right` 清零后这个抵消关系被破坏，按钮在 393px 宽的屏幕上从 `381` 延伸到 `409`——**溢出 16px 被裁掉**。

修复：不再覆盖 `padding-right`。

```css
[data-sidebar-collapsed] .wSkVaW_header{padding-left:50px}
```

### 2. iOS 输入框聚焦缩放

**文件**：`lib/client.js`

composer 是 Lexical 的 `div[contenteditable=true][data-composer-input]`（不是 `input`/`textarea`），字号 14px。iOS 在聚焦字号小于 16px 的可编辑元素时会缩放整个页面。

修复：把表单控件和可编辑元素的字号提到 16px。

### 3. 抑制橡皮筋回弹

**文件**：`lib/client.js`

`overscroll-behavior: none` 应用于 `html`、`body` 和内部滚动容器。

### 4. 禁用双指缩放

**文件**：`lib/client.js`

iOS Safari 会忽略 `user-scalable=no`，所以改用拦截 WebKit 的 `gesturestart` / `gesturechange` / `gestureend` 以及多指 `touchstart` / `touchmove`。只拦截多指，单指滚动不受影响；仅对 App 窗口和触屏设备生效。

### 5. PWA 图标与 iOS 主屏图标（本 fork 新增）

**文件**：`lib/index.js`、`icons/`

上游只在 manifest 里提供 SVG 图标，而 **iOS 不接受 SVG 格式的 `apple-touch-icon`**，会退化成拿页面截图当图标。同时 DSH 静态服务器的 MIME 表没有 `.png` 条目，直接放 PNG 会被当成 `application/octet-stream` 发送。

本 fork 因此：

- 自带 `icons/` 和三条路由，响应带正确的 `content-type: image/png`
- 通过 `webServer.tapIndex()` 注入 `<link rel="apple-touch-icon">`
- manifest 的 `icons` 改为 PNG 优先，SVG 保留为兜底

图标为白底 + `#4D6BFE` 蓝鲸，180/192/512 三种尺寸。

## 安装

profile 的 `package.json`：

```json
{
  "dependencies": {
    "@local/dsh-mobile-ui": "link:../../local-plugins/dsh-mobile-ui"
  },
  "dsh": {
    "profile": {
      "bundles": ["...", "@local/dsh-mobile-ui"]
    }
  }
}
```

用 `link:` 而不是 `file:`：`file:` 会复制且只复制 `files` 字段列出的内容，`link:` 是 symlink，改动即时生效。

改完执行 `pnpm install`，然后重启 DSH。

## 与上游同步

上游类名哈希是按特定 DSH 构建生成的，DSH 版本变化后部分规则可能静默失效。若上游更新到你的 DSH 版本，可以考虑切回上游包。
