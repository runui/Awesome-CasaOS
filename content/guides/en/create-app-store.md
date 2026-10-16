Create a community app store for ZimaOS and CasaOS by forking an existing store, removing the apps you don’t need, and adding your own. We recommend starting with ZimaOS. Choose a project from the [community collection](/) as your starting point.

## Before you begin

You should be comfortable forking repositories and pushing commits on GitHub. This guide uses the official CasaOS AppStore as an example of a store’s repository structure. Test the system versions and architectures you plan to support, and document the results in your store.

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

## 04 — Test on ZimaOS and CasaOS

Start with our recommended platform, ZimaOS. If your store also targets CasaOS, test it separately on a CasaOS device. Document the system versions and architectures you have tested.

1. Return to your repository on GitHub.
2. Open the **Code** menu.
3. Copy the link for **Download ZIP**.
4. Open the App Store on the ZimaOS or CasaOS device you are testing and find its source settings.
5. Paste the ZIP URL and confirm the new source.
6. Wait for your app to appear in the store.

## Share it with the community

If your store adds something useful to the ZimaOS and CasaOS community and you’re committed to maintaining it, [submit a pull request](https://github.com/IceWhaleTech/Awesome-CasaOS) to be considered for the collection. See the [contribution guide](https://github.com/IceWhaleTech/Awesome-CasaOS/blob/main/CONTRIBUTING.md) for the required information.
