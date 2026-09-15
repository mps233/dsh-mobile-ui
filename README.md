# DSH Mobile UI（本地分支）

[`@canary-builds/dsh-mobile-ui`](https://github.com/Canary-Builds/dsh-mobile-ui) 的本地分支，把 DSH 的 Web 界面按手机的方式重排，并让页面能作为独立窗口装到主屏幕上。

上游写的是 DSH `0.1.1-rc.x`。在 `0.1.5` 上它有一处布局会对不齐，iOS 那边也有几个老问题，顺手都处理了。包名改成 `@local/dsh-mobile-ui`，免得和上游混在一起。

## 改动

**顶栏右侧的按钮被切掉**

折叠侧边栏时，顶栏最右边那个按钮有一半在屏幕外。DSH 给这个按钮设了 `margin-right: -16px`，本意是抵消 header 自己的 `padding-right`；上游把那处 `padding-right` 改成了 0，抵消没了，负边距就变成实打实地往外冲。去掉覆盖就行。

**点输入框整页放大**

输入框其实是 Lexical 的可编辑 div，字号 14px。iOS 碰到小于 16px 的可编辑元素，聚焦时会把整页缩放。把字号提到 16px。

**滚到边缘会回弹**

`overscroll-behavior: none`。

**双指缩放**

iOS Safari 不理会 `user-scalable=no`，所以改拦 WebKit 的手势事件。只拦多指，单指滚动不受影响。

**主屏图标**

上游的 manifest 只给了 SVG。iOS 不认 SVG 的 `apple-touch-icon`，会退而拿页面截图当图标；而 DSH 的静态服务器没有 `.png` 的 MIME 映射，直接放 PNG 会被当成 `application/octet-stream` 发出去。这里自带图片和路由，响应带正确类型，同时注入 `apple-touch-icon` 链接。

图标是白底蓝鲸，180 / 192 / 512 三档。

逐条的技术细节写在 [FORK.md](FORK.md)，上游原文见 [README.upstream.md](README.upstream.md)。

## 安装

在 profile 的 `package.json` 里：

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

用 `link:` 而不是 `file:`。后者是复制，并且只复制 `files` 字段里列出的内容（`icons/` 就这么漏过一次）；前者是软链接，改完直接生效。

然后 `pnpm install`，重启 DSH。

## 许可

沿用上游的 MIT，版权归 Canary Builds。
