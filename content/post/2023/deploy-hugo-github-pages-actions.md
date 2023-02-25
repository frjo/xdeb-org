---
title: "Automatically deploy Hugo site to GitHub pages with actions"
slug: "deploy-hugo-github-pages-actions"
date: 2023-01-06T11:33:53+01:00
lastmod: 2023-01-06T11:33:53+01:00
author: "Fredrik Jonsson"
tags: ["hugo","github","development"]

---

One of the big advantages with static sites is that you can host them almost anywhere. I have found that GitHub pages is one of the most convenient hosting solutions.

With the help of GitHub actions the deployment process can be completely automated. Push code to the repo and a minut later your site is updated.

The standard way to set it up was to build the site via an action to the "gh-pages" branch. GitHub would then run an extra action to take that content and deploy it to GitHub pages.

{{< figure src="images/hugo-github-actions-1.png" width="400" alt="GitHub actions when deploying from branch." caption="GitHub actions when deploying from branch trigger an extra pages-build-deployment action." >}}

This is no longer needed. You can now deploy directly to GitHub pages within your own action. See [Configuring a publishing source for your GitHub Pages site - GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow).

This is the workflow I use for all Hugo sites I deploy. Add it to your Hugo site repos.

File: `.github/workflows/pages.yaml`

~~~~ yaml
name: Deploy pages on push

# When the action should run. Here we specify it should run on push to main branch.
# We also allow for manually running the action with the empty "workflow_dispatch".
on:
  push:
    branches:
      - main

  workflow_dispatch:

# Set the needed permissions
permissions:
  contents: read
  pages: write
  id-token: write

# Cancel running deployments if a new one is issued.
concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: "latest"
          extended: true

      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v2

      - name: Build
        run: hugo --baseURL "${{ steps.pages.outputs.base_url }}/"

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v1
        with:
          path: ./public

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v1
~~~~

Then go to "Settings -> Pages" for your repo. Set the "Source" to GitHub Actions".

{{< figure src="images/hugo-github-actions-2.png" width="600" alt="GitHub pages settings" caption="Deploying directly from action is in beta but works without issues in my experience." >}}

Now you are done. The site will automatically build and deploy.
