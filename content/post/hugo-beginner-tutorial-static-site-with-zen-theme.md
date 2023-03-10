---
title: "Hugo beginner tutorial static site with zen theme"
slug: "hugo-beginner-tutorial-static-site-with-zen-theme"
date: 2019-05-25T20:21:18+02:00
lastmod: 2019-05-25T20:21:18+02:00
author: "Fredrik Jonsson"
tags: ["hugo","web","development"]
draft: true

---

In this tutorial I will show how set up a simple blog site with the static site generator [Hugo](https://gohugo.io/) and my own [Zen theme for Hugo](https://github.com/frjo/hugo-theme-zen). I will assume you are using a Unix based system like macOS, a Linux distro or a BSD variant. In Windows you can use the Windows Subsystem for Linux (WSL).


## What you will need

### A Terminal

Hugo is a command line application so you need to run commands in a Terminal. Unix based systems have a Terminal built in.

For Windows you can install the Windows Subsystem for Linux (WSL), [Install Windows Subsystem for Linux (WSL) on on Windows 10](https://docs.microsoft.com/en-us/windows/wsl/install-win10).

If you are new to the command line start with [Introduction to command line · Django Girls Tutorial](https://tutorial.djangogirls.org/en/intro_to_command_line/).

**Everything below will take place inside an Terminal window so open one up now.**

### Git version control

Not a hard requirement but I recommend it. Makes it easy to install themes and having your code in version control is generally a good idea.

Instructions at [Git - Downloads](https://git-scm.com/downloads).

For macOS the easiest is to use [Homebrew](https://brew.sh/).

~~~~
brew install git
~~~~


### Hugo installed on your computer

Instructions at [Install Hugo](https://gohugo.io/getting-started/installing).

Make sure you get the extended version that has sass support. For most plattforms that is the default option.

If you are on macOS and have Homebrew.

~~~~
brew install hugo
~~~~

Make sure Hugo is installed and working by running this command.

~~~~
hugo version
~~~~

The response should show you the version installed, confirm that it is the extended. version.


## Where to set up your site

All files you work on should be in your home directory. In most cases a new Terminal window will open up in the logged in users home directory be default. 

To make sure you are in the home directory do a change directory command (cd) without any options. It will always move you to your home directory.

~~~~
cd
~~~~

To check what directory you are in, issue the print working directory command (pwd).

~~~~
pwd
~~~~

It will return `/home/yourusername` on Linux and `/Users/yourusername` on macOS to give two examples.

To see what is inside your home directory you issue the list command (ls).

~~~~
ls
~~~~

In your home directory you create all the directories you need for your files. For this tutorial I suggest putting all your web sites inside a "Sites" directory.

On macOS this already exists by default, on Linux it's easy to crate with the make directory command (mkdir).

~~~~
mkdir Sites
~~~~

Move in to the Sites directory with the change directory command (cd).

~~~~
cd Sites
~~~~

Issue the print working directory command (pwd).

~~~~
pwd
~~~~

It should return `/home/yourusername/Sites` on Linux and `/Users/yourusername/Sites` on macOS.

You are now ready to create your first Hugo site.


## Setting up a new site

While in the "Sites" directory run the hugo new site command and give the name of the site you want to create. I suggest that you for this tutorial use "zentutorial".

~~~~
hugo new site zentutorial
~~~~

Move in to the newly create site with.

~~~~
cd zentutorial
~~~~

Lets start by adding a gitignore file. This will tell the git version control what files to ignore. Even if you do not intend to use git it's good to have in place.

The ".DS_Store" is a macOS specific file that are in most folders and should not be part of a web site. The "public" directory is where Hugo put the built site, what you will upload to your web server. And that should not be in the git repository.

~~~~
echo ".DS_Store\npublic/" > .gitignore
~~~~

List the content with.

~~~~
ls
~~~~

It will show the following.

~~~~
archetypes
content
data
layouts
static
themes
.gitignore
config.toml
~~~~

You now have a Hugo site, but no theme.

## Installing a theme

~~~~
git clone https://github.com/frjo/hugo-theme-zen.git themes/zen
~~~~

~~~~
git submodule add https://github.com/frjo/hugo-theme-zen.git themes/zen
~~~~


## Add your first content



## Build the site and take a look at it.




## Configure Hugo




## Adding some real content




## Adding images and videos




## Setting up an audio podcast




## Upload your site to a web server





~~~~
hugo --minify && rsync -e 'ssh -ax -p 22'  --archive --delete --verbose --compress --human-readable --exclude '.DS_Store' public/ host.example.com:/var/www/
~~~~
