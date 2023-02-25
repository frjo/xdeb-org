---
title: "Build Hugo site with Notion and Airtable API"
slug: "build-hugo-site-notion-airtable-api"
date: 2023-01-08T17:02:10+01:00
lastmod: 2023-01-08T17:02:10+01:00
author: "Fredrik Jonsson"
tags: ["hugo","github","development"]

---

Last year I built a number of Hugo sites that takes the content from Notion and Airtable via their respective API. It works really well. Users manage the data in Notion or Airtable and the sites are kept updated in the background automatically.

Airtable can execute webhooks on different events so easy to trigger web site builds in GitHub. For Notion I found no such option so use a cronjob for these sites.

The steps in my solution is as follows:

1. Get the content as json from the API and save it to a local file.
2. Create markdown files for each post in the json files.
3. Use GitHub action to run step 1 and 2.
3. Use Github action to build and deploy the site with the updated content.


## Get the content as json from the API and save it to a local file

For step 1 I have built some python scripts. They are quite straight forward. First the one for Airtable and below that for Notion.

File `airtable_to_json.py`:

~~~~ python
#!/usr/bin/env python3

import json
import os
import requests

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    pass
else:
    load_dotenv()

api_key = os.getenv('AIRTABLE_API_KEY')
base_id = os.getenv('AIRTABLE_BASE_ID')
api_url = f'https://api.airtable.com/v0/{base_id}'
sheets = [
    ('Sheet1', 'View1'),
    ('Sheet2', 'View2'),
    ('Sheet3', 'View3')
    ]
out_dir = 'import'


def get_data_page(sheet, view=None, offset=None):
    url = f'{api_url}/{sheet}'
    headers = {
      'Authorization': f'Bearer {api_key}',
      'Content-Type': 'application/json'
    }
    params = {
      'pageSize': 100,
      'offset': offset
    }
    if view:
        params['view'] = view
    response = requests.request('GET', url, headers=headers, params=params)
    return response


def get_data(sheet, view=None):
    results = get_data_page(sheet, view)
    results_json = results.json()
    output = results_json['records']

    while 'offset' in results_json:
        results = get_data_page(sheet, view, results_json['offset'])
        results_json = results.json()
        output = output + results_json['records']

    return output


def write(sheet, data):
    filename = sheet.lower()
    path = f'{out_dir}/{filename}.json'
    with open(path, 'w') as file:
        print(json.dumps(data, sort_keys=True, indent=4), file=file)


def main():
    try:
        os.mkdir(out_dir)
    except FileExistsError:
        pass
    for sheet in sheets:
        data = get_data(sheet[0], sheet[1])
        write(sheet[0], data)


if __name__ == '__main__':
    main()
~~~~


File `notion_to_json.py`:

~~~~ python
#!/usr/bin/env python3

import json
import os
import requests

from notion_client import Client

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    pass
else:
    load_dotenv()

db_id_1 = os.getenv('NOTION_DB_ID_1')
db_id_2 = os.getenv('NOTION_DB_ID_2')
databases = [
    ('db1', db_id_1),
    ('db2', db_id_2)
    ]
api_key = os.getenv('NOTION_API_KEY')
out_dir = 'import'


def get_data(db_id):
    notion = Client(auth=api_key)
    response = notion.databases.query(**{'database_id': db_id, 'page_size': 100})
    output = response.get('results', [])
    return output

def write(name, data):
    filename = name.lower()
    path = f'{out_dir}/{filename}.json'
    with open(path, 'w') as file:
        print(json.dumps(data, sort_keys=True, indent=4), file=file)


def main():
    try:
        os.mkdir(out_dir)
    except FileExistsError:
        pass
    for db in databases:
        data = get_data(db[1])
        write(db[0], data)


if __name__ == '__main__':
    main()
~~~~


## Create markdown files for each post in the json files

Step two is also solved with a python script. This script needs a lot of custom parts for each site. We need to extract out the needed frontmatter in a format the Hugo understands. You can use json, toml or yaml. I tend to use yaml myself.

File `json_to_hugo.py`:

~~~~ python
#!/usr/bin/env python3
"""
The json file must contain a "title" column and any main content should be in a "body" column.
"""

import argparse
import json
import os
import re
import unicodedata

from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('source', type=str, help='Path to the source json file.')
parser.add_argument('out_dir', type=str, help='Output directory for the generated markdown files.')
args = parser.parse_args()

source = args.source
out_dir = args.out_dir
import_dir = 'import'


def slugify(value, spacer='-'):
    value = str(value)
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value).strip().lower()
    return re.sub(r'[-\s]+', spacer, value)


def get_related_list(ids, type):
    related = []
    for id in ids:
        relate = get_related(id, type)
        if relate:
            related.append(relate)
    return '","'.join(related)


def get_related(id, type):
    path = f'{import_dir}/{type}.json'
    with open(path) as json_file:
        items = json.load(json_file)
        for item in items:
            if item['id'] == id:
                return slugify(item['fields']['Title'])

def create_dir(dir):
    try:
        os.mkdir(dir)
    except FileExistsError:
        pass

def write(path, item, item_title):
    with open(path, 'w') as file:
        print('---', file=file)
        for key, value in item['fields'].items():
            is_string = True
            is_terms = False
            if type(value) is list:
                is_string = False
            if type(value) is str:
                value = value.strip().replace('"', r'\"')
            if not is_string and key.lower() in ['key1', 'key2']:
                value = value[0].strip()
                is_string = True
            if key.lower() in ['key3', 'key4']:
                try:
                    value = '","'.join([v.strip() for v in value.split(',')])
                except AttributeError:
                    value = value[0].strip()
                is_terms = True
            if key.lower() == 'file':
                value = value[0]['url']
                is_string = True
            if key.lower() == 'key5':
                value = get_related(value[0], 'sheet1')
                is_string = True
            if key.lower() == 'key6 press':
                value = get_related_list(value, 'sheet2')
                is_terms = True
            if is_terms:
                value = f'["{value}"]'
            elif is_string:
                value = f'"{value}"'
            if key.lower() != 'text':
                param = slugify(key, '_')
                print(f'{param}: {value}', file=file)
        print('\n---\n', file=file)
        if 'Text' in item['fields']:
            print(item['fields']['Text'], file=file)


def main():
    create_dir(out_dir)
    json_file = open(source, newline='')
    json_content = json.load(json_file)
    for item in json_content:
        try:
            item_title = item['fields']['Title']
        except IndexError:
            pass
        else:
            filename = slugify(item_title)
            path = Path(f'{out_dir}/{filename}.md')
            write(path, item, item_title)


if __name__ == '__main__':
    main()
~~~~

## Use GitHub action to run step 1 and 2

Here is an example workflow for Airtable. It is triggered by an webhook call from Airtable.

It runs the script to retrieve new content as json and the script to create markdown files from the json. It then commits and changes to the repo.

The needed API keys etc. are stored as GitHub secrets. As secure as it gets with cloud services.

~~~~ yaml
name: Pull from Airtable

on:
  repository_dispatch:
    types:
      - airtable

concurrency:
  group: ${{ github.workflow }}
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Get Airtable sheets as json
        run: ./scripts/airtable_to_json.py
        shell: sh
        env:
          AIRTABLE_API_KEY: ${{secrets.AIRTABLE_API_KEY}}
          AIRTABLE_BASE_ID: ${{secrets.AIRTABLE_BASE_ID}}

      - name: Create publications
        run: ./scripts/json_to_hugo.py import/sheet1.json content/sheet1
        shell: sh

      - name: Create partners
        run: ./scripts/json_to_hugo.py import/sheet2.json content/sheet2
        shell: sh


      - name: Pull again in case of any updates from cancelled job
        run: git pull
        shell: sh

      - name: Commit changed content files
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          file_pattern: content/* import/*
~~~~


## Use Github action to build and deploy the site with the updated content

Last thing is then to build and deploy the site. We run this on each successful run of the "Pull from Airtable" workflow.

~~~~ yaml
name: Deploy Pages on Airtable Update

on:
  workflow_run:
    workflows: [Pull from Airtable]
    types:
      - completed

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: deploy
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
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

