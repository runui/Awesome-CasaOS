The quickest way to create your own app store is to fork an existing one, remove the apps you don’t need, and add your own. You can start with any project in the [community collection](/).

## Before you begin

You should be comfortable forking repositories and pushing commits on GitHub. In this guide, we’ll start with the official CasaOS AppStore.

## 01 — Fork an app store

1. Open the [official CasaOS AppStore](https://github.com/iceWhaleTech/CasaOS-AppStore) and select **Fork**.
2. Review the settings and select **Create fork**.
3. Wait for your new repository to be ready.

## 02 — Make it your own

1. Press the **.** key on your repository page to open the online editor.
2. Remove the other folders, keeping the `Apps` folder.
3. Remove the apps inside `Apps`. You can keep one as a template.
4. Remove unnecessary files. These files are useful to keep if present:
    - `category-list.json` — app categories and descriptions.
    - `recommend-list.json` — featured apps in the CasaOS App Store.
    - `CONTRIBUTING.md` — guidelines for creating an app.

## 03 — Add your first app

Follow the repository’s `CONTRIBUTING.md` to add an app to the `Apps` folder. Use an existing app as a template, then commit and push your changes.

## 04 — Try it on CasaOS

1. Return to your repository on GitHub.
2. Open the **Code** menu.
3. Copy the link for **Download ZIP**.
4. Open the App Store in CasaOS and select **+ Add Source**.
5. Paste the URL and select **Add +**.
6. Wait for your app to appear in the store.

## Share it with the community

If your store adds something useful to the CasaOS community and you’re committed to maintaining it, [submit a pull request](https://github.com/IceWhaleTech/Awesome-CasaOS) to be considered for the collection. See the [contribution guide](https://github.com/IceWhaleTech/Awesome-CasaOS/blob/main/CONTRIBUTING.md) for the required information.
