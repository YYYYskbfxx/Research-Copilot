# 访研搭档 Research Copilot

面向用户研究员和产品经理的研究工作台：研究设计、主客观资料导入、证据定位、可编辑洞察、人工确认、候选产品机会与报告。右侧对话可围绕当前洞察和关联记录多轮追问。

## 体验与材料

打开 `docs/index.html` 可体验离线流程。内置模拟案例有 6 位虚构参与者和 24 条记录；可单独导入 `docs/sample-research/` 中的 CSV。模拟材料与结论不代表真实实习项目或产品效果。工作区状态保存在当前浏览器的本地存储中。

## 运行模型对话

需要 Node.js 18 或更新版本。复制 `.env.example` 为 `.env`，在方舟控制台创建 API Key，并将它填入 `ARK_API_KEY`。当前示例使用已开通的 DeepSeek-V4.1-Flash 经济版；若账号开通其他模型，填写对应模型 ID。运行 `npm start`，打开 `http://127.0.0.1:5196`。使用系统代理的 Node 24 环境可先设置 `NODE_USE_ENV_PROXY=1`。

Key 只在服务端读取。不要提交 `.env`，也不要将真实访谈、个人数据或企业内部资料上传到公开演示。GitHub Pages 只能运行离线页面，不能调用本地 Node API。

## 代码位置

- `docs/research.js`：研究方案、资料导入、证据引用、卡片编辑和对话界面。
- `server.mjs`：静态文件服务和模型对话接口。
- `docs/sample-research/`：可公开的模拟 CSV。
