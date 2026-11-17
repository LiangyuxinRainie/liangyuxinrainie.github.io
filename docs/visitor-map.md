# 访客地图与 GA4 配置

地图保持示例的世界地图、访客圆点、国家/地区国旗和人数排行风格。
地图轮廓、国旗图片与统计 JSON 都由你的网站提供。访客浏览器不再需要加载 FlagCounter 图片。

## 已接入的配置

`content/analytics.toml`：

- `measurement_id = "G-L4W4XSTEX3"`：网站采集 ID，已经配置。
- `property_id = "564818493"`：GA4 属性 ID，已经配置。
- `stream_id = ""`：可选，纯数字 Stream ID，用于将统计限定在一个数据流。
- `start_date = "2020-10-14"`：默认查询该属性的全部可用历史，不会产生 GA4 启用之前的数据。

Measurement ID、Stream ID 与属性 ID 是三个不同的标识，不能互相替代。
服务账号私钥绝不能放入此配置文件、`public/`、聊天或公开 GitHub 仓库。

## 1. 找到 GA4 属性 ID

进入 Google Analytics → 左下角“管理” → “属性设置” → “属性详情”，
查看“属性 ID”。也可以打开“报告”页面，查看地址栏中 `p` 后的一串数字：
例如 `.../#/a123456p987654321/reports/...` 的属性 ID 是 `987654321`。

将它填入 `content/analytics.toml` 的 `property_id`。
也可在 GitHub 仓库创建 `GA_PROPERTY_ID` Secret 或 Variable 覆盖文件中的值。

## 2. 授权 GitHub 读取统计

1. 在 Google Cloud Console 中选择或创建项目，启用 **Google Analytics Data API**。
2. 进入 IAM 和管理 → 服务账号 → 创建服务账号。
   仅查询 Analytics 时无需给它授予 Google Cloud 项目的 Owner/Editor 角色。
3. 在服务账号的“密钥”中添加 JSON 密钥并下载到自己的电脑。
4. 复制该服务账号的邮箱（通常以 `iam.gserviceaccount.com` 结尾）。
5. 回到 GA4 → 管理 → **属性访问权限管理**，添加上述邮箱并赋予 **查看者 / Viewer** 权限。
6. 在 GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret：
   名称填 `GA_CREDENTIALS`，值粘贴完整的 JSON 密钥内容。
   不要把 JSON 当作普通文件上传到 GitHub。

`GA_MEASUREMENT_ID` Secret 可选；没有它时会使用已填好的 `content/analytics.toml`。
`GA_STREAM_ID` 和 `GA_START_DATE` Variables 可选，分别覆盖数据流筛选和查询起始日期。

## 3. 上传和运行

上传本次修改的源代码，尤其要包含：

- `.github/workflows/deploy.yml`：构建并发布网站。
- `.github/workflows/update-visitors.yml`：每六小时读取 GA4 并触发发布。
- `content/analytics.toml`、`scripts/`、`src/`、`public/` 和两个 package JSON 文件。

GitHub Pages 的 Source 继续选择 **GitHub Actions**。
网页拖拽上传如果遗漏 `.github`，使用 Add file → Create new file，
输入完整路径 `.github/workflows/update-visitors.yml`，粘贴本地文件内容并提交。
`deploy.yml` 也必须存在，不能只创建其中一个。

先等待 **Deploy to GitHub Pages** 成功，让线上页面开始采集；
配置好属性 ID 和服务账号后，进入 Actions → **Update visitor map** → Run workflow。
它会更新 `public/visitor-stats.json`，随后重新运行部署。
以后按计划自动执行，通常无需手工编辑统计数字或重新上传 `out`。

如果缺少属性 ID 或 `GA_CREDENTIALS`，更新任务会明确提示跳过。
读取权限错误时更新任务会失败，之前成功读取的统计会保留。
主分支若受分支保护限制，需要允许此工作流提交统计文件，否则提交步骤会报错。

## 数据含义与等待时间

- “visitors” 使用 GA4 的 `totalUsers`，不是页面浏览次数。
- 报告只统计 `content/config.toml` 中网站域名的访问。
  本地 localhost / 127.0.0.1 预览不触发采集。
- 国家/地区使用 GA4 的汇总报告，不是访客精确位置。
  同一用户可能出现在多个地区，所以地区人数之和不一定等于总访客数。
- 初次配置后地图先显示“Visitor statistics are being prepared.”；
  首次成功读取后显示实际数字，真实空报告会显示 0。
- GA4 标准报告可能延迟 24–48 小时；本站每六小时读取一次。
  GA4 的实时报告中看到访问，不代表地图马上能读到相同数据。
- Google Analytics 被访客浏览器或网络屏蔽时，该次访问可能无法计入。
  地图图形本身仍从本站加载。
- 以前的 FlagCounter 计数不会自动迁移到 GA4。

## 地图与国旗资源

- `public/visitor-map.json`：世界地图轮廓、地区坐标、国旗位置索引。
- `public/visitor-flags.png`：250 面国旗合并为一张图片，避免上传大量小文件。
- `public/visitor-stats.json`：仅含访客总数与地区汇总的公开数据。
- `src/components/home/VisitorMap.tsx`：地图绘制和排行。
- `src/components/analytics/GoogleAnalytics.tsx`：GA4 采集。
- `scripts/update-visitor-stats.mjs`：服务账号读取报告，仅在本机或 Actions 中运行。

地图和国旗来自提供的 `add-visitor-map.patch`。
国旗原始 PNG 来自 [world-countries 5.1.0](https://github.com/mledoze/countries/tree/v5.1.0/data)；
上游说明国旗美术素材不包含在其数据库 ODbL 许可内，见
[许可说明](https://github.com/mledoze/countries#license)。

如需重新生成国旗合图，将补丁的资源解出到一个临时目录，然后执行：

```powershell
node scripts/build-visitor-assets.mjs "解出后的 public 目录"
```

日常修改简介、论文等内容无需重新生成地图或国旗。
