为 ZimaOS 和 CasaOS 创建社区应用商店，可以从 Fork 一个现有商店开始，移除不需要的应用，再加入自己的应用。我们推荐优先从 ZimaOS 开始。你可以从[社区商店目录](/zh/)中选择一个项目作为起点。

## 开始之前

你需要熟悉在 GitHub 上 Fork 仓库和推送提交的基本操作。本教程以 CasaOS 官方应用商店的仓库结构为例。计划支持的系统版本和架构，需要逐项测试，并在商店说明中记录结果。

## 01 — Fork 一个商店

1. 打开 [CasaOS 官方应用商店](https://github.com/iceWhaleTech/CasaOS-AppStore)，点击 **Fork**。
2. 检查设置，点击 **Create fork**。
3. 等待新仓库创建完成。

## 02 — 整理为自己的商店

1. 在仓库页面按下 **.** 键，打开在线编辑器。
2. 删除其他文件夹，保留 `Apps` 文件夹。
3. 移除 `Apps` 中的应用，也可以保留一个应用作为模板。
4. 删除不需要的文件。如果存在以下文件，可以按需保留：
    - `category-list.json`：应用分类与说明。
    - `recommend-list.json`：CasaOS 应用商店中的推荐应用。
    - `CONTRIBUTING.md`：创建应用的贡献指南。

## 03 — 添加第一个应用

根据仓库的 `CONTRIBUTING.md`，向 `Apps` 文件夹添加应用。你可以参考已有应用作为模板，完成后提交并推送修改。

## 04 — 在 ZimaOS 和 CasaOS 中测试

优先在我们推荐的 ZimaOS 中测试。如果商店也面向 CasaOS，请在 CasaOS 设备上分别验证，并在说明中列出测试过的系统版本和架构。

1. 返回 GitHub 仓库页面。
2. 展开 **Code** 菜单。
3. 复制 **Download ZIP** 的链接地址。
4. 在要测试的 ZimaOS 或 CasaOS 中打开应用商店，进入应用源设置。
5. 粘贴 ZIP 地址并确认添加。
6. 等待你的应用出现在商店中。

## 分享给社区

如果你的商店能为 ZimaOS 和 CasaOS 社区带来价值，并且你愿意持续维护，欢迎向 [Awesome ZimaOS 提交 Pull Request](https://github.com/IceWhaleTech/Awesome-CasaOS)，申请加入目录。所需资料请参阅[贡献指南](https://github.com/IceWhaleTech/Awesome-CasaOS/blob/main/CONTRIBUTING.md)。
