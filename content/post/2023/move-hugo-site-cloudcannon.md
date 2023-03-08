---
title: "Move a Hugo site to CloudCannon CMS"
slug: "move-hugo-site-cloudcannon"
date: 2023-02-27T15:06:40+01:00
lastmod: 2023-02-27T15:06:40+01:00
author: "Fredrik Jonsson"
tags: ["hugo","cloudcannon","development"]
description: "Tips to ease the move of a complex Hugo site to the CloudCannon CMS."

---

{{< figure src="images/cloudcannon.png" class="right" width="180" alt="CloudCannon logo" >}}

I found [Hugo](https://gohugo.io/) in 2017 and since then I have used it to build a lot of web sites. Building sites with Hugo is fun!

For customer sites where an editor need to keep the site updated I early on started to use [Forestry.io](https://forestry.io/). Quick and easy to setup and sync all changes to GitHub without issues. Editors can jump in and start working without much help.

Last year Forestry annonsed they where closing down the service by early 2023. Good on them to give people many month to plan a migration to other systems. They have a new product called [Tina CMS](https://tina.io/) that seems very JavaScript framework oriented. Not my cup of tea.

I looked for a new solution with these features:

1. First class Hugo support (shortcodes, assets etc.).
2. Easy for editors to use without much learning curve.
3. Option to sync to GitHub without lock in on hosting.
4. Easy to configure and no need to adapt the sites.
5. Resonable pricing.

The options are surprisingly few. After testing them the only one I found interesting was [CloudCannon](https://cloudcannon.com/).

## CloudCannon

When you have everything setup, CloudCannon is a impressive editing environment. The clients that have tested it was quite pleased. This is most likely the service I will use moving forward.

But, setting it all up was far more work than I planed for. On one customer site, where they have a lot of shortcodes, the CloudCannon conf file ended up 700+ lines long.

With Forestry it was a lot less work and you could do most of it directly in the UI. It was also a simpler environment. Forcing editors to handle shortcodes manually resulted in quite a few support issues. CloudCannons shortcode support is far more advanced.

### Pricing

Pricing starts at 45 USD per month. You can have as many sites as you like but only three users. Each additional user is 10 USD per month. Not a big fan of that type of pricing but it's very common.

You can also set up a "site share" for 10 USD per month. That is essentially a password that you give out to any number of editors so they can edit the site. My customers tend to want to see who made what changes. I will therefor not make much use of that feature.

This is a business solution for businesses and for that the pricing is resonable I think.

### Initial setup

Getting started with CloudCannon is very straight forward. Create an account, authenticate with GitHub and import the site. Done.

### Hosting

CloudCannon offer hosting but I never looked at it. Most likely it works perfectly fine.

I host personal sites on my own server and customers sites are almost all on GitHub pages.

### Three different editors, visual, content and source

I only bothered with the content editor. It is what I would call the normal editor. You get a sidebar with fields for all the front matter and a big area for the body with a toolbar at the top.

The visual editor shows the rendered pages and allows you to edit sections that are set up for it. You need to add classes to your templates and additional configuration to set it up. For my projects I saw no benefit in spending time on this. Setting up the parts I did was time consuming enough.

The source editor allows you to edit the plain markdown files. When I need do do that I use my favourite text editor, not a browser.

### The documentation

[CloudCannon documentation](https://cloudcannon.com/documentation/?ssg=Hugo) looks really nice and thorough at first glance. When I actually started using it I hit a lot of brick-walls and was forced to contact support. Luckily the support is both quick and competent and could help me with all my issues. This however was time consuming and it took me far longer to get the first sites set up than I had anticipated.

The documentation gives you some very simple examples that is not really helpful for real sites. Then you have reference pages that have a lot of information but do not really tell you how it all should hang together.

I miss examples for how to set up complex, real world, web sites.

Now that I have set up my first sites, the rest will be mush easier. If the editors are happy, the time spent will be worth it. But with better documentation and examples it could have been a lot easier I think.

My guess is that a lot of effort has gone it to building the tools and that the documentation has been lagging. A few things I needed support for turned out to be undocumented even.

I know from my own experience that writing code is a lot more fun then writing documentation. But a nice product like CloudCannon deserves good documentation.

On a project I work with we follow [Diátaxis](https://diataxis.fr/), "A systematic framework for technical documentation authoring". I think it makes sense and we have good feedback from users.

### cloudcannon.config.yaml examples

Here are some examples from the [example conf file](https://github.com/frjo/hugo-theme-zen/blob/main/cloudcannon.config.yaml.example) I have added to my [Hugo Zen theme](https://github.com/frjo/hugo-theme-zen).

Hopefully this can be useful for others starting out with CloudCannon.

#### Schemas (archetypes)

Collection schemas is one of the most important things to set up. Without specifying content schemas (more or less archetypes in Hugo speak) CloudCannon will not understand what fields to set up for editing the front matter.

I have archetypes setup for each content type that list all the needed front matter. Do not know why CloudCannon can not autodetect them like Hugo does. You need to point to them with the "path" attribute. 

With schemes you can also set upp alternative archetypes with e.g. default type/layout values. That is handy. Editors will then get easy choices for what type of page they want to create in each section.

OBS! One vital setting to add is `remove_extra_inputs: false`. It needs to be set for each and every schema type. This will stop CloudCannon from deleting front matter params that are not listed. I strongly believe the default for this setting should be "false".

I often add front matter params to content that editors should never change. I on purpose did not add these params to the schemas and was surprised to see them deleted when an editor tested to edit a post.

~~~~ yaml
collections_config:
  pages:
    schemas:
      default:
        path: archetypes/default.md
        remove_extra_inputs: false
  micro:
    schemas:
      default:
        path: archetypes/micro.md
        remove_extra_inputs: false
~~~~


#### Inputs

Also important to to set up is the inputs. This decide what widget you get for inputing the different front matter params. Some obvious ones are autodetected but I suggest you configure them all to be sure everything is in place.

Even if "date" is autodetected you need to add `instance_value: NOW` to get todays date and time to be pre-filled. I search for terms like default/pre/initial but then support informed me it was called `instance_value`. It is documented but hard to find when the name is not something you thought to search for.

~~~~ yaml
_inputs:
  title:
    type: text
    comment: The title of your page.
  date:
    type: datetime
    instance_value: NOW
    comment: Date of this page.
  description:
    type: textarea
    comment: Short desciption, for search engines and sharing.
  draft:
    type: switch
  image:
    type: image
  tags:
    type: array
    comment: Tags for this page.
  tags[*]:
    type: text
~~~~


#### Snippets (shortcodes)

If you use a lot of shortcodes this will be the bulk of your configuration.

Needed a lot of trial and error and a lot of contact with support to get this working. Especially the previews. The `view: gallery` setting is e.g., as far as I can see, still undocumented.

If you use shortcodes but do not configure snippets for them, they show up in the content editor as "unknown". All the editor can do then is move them, no editing is of them possible.

Setting `optional: true` for optional attributes is vital. If a shortcode is missing a attribute that is not set as optional, Cloudcannon will bail out and say that the shortcode is "unknown".

Picking the right `template` is key. For Hugo there are three types.

1. `hugo_shortcode` when there are no arguments.
2. `hugo_shortcode_positional_args` when there are positional arguments.
3. `hugo_shortcode_named_args` when there are named arguments.

Each type then have four variants, e.g.

1. `hugo_shortcode` for `{{</* shortcode */>}}`.
2. `hugo_paired_shortcode` for `{{</* shortcode */>}}Some inner content{{</* /shortcode */>}}`.
3. `hugo_markdown_shortcode` for `{{%/* shortcode */%}}`.
4. `hugo_paired_markdown_shortcode` for `{{%/* shortcode */%}}Some inner content{{%/* /shortcode */%}}`.


~~~~ yaml
_snippets:
  zen_contact:
    template: hugo_shortcode
    inline: false
    preview:
      icon: email
      text: Contact form
    definitions:
      shortcode_name: contact

  zen_wrapper:
    template: hugo_paired_shortcode_positional_args
    inline: false
    preview:
      icon: wrap_text
      text: Wrapper
      subtext:
        - key: class
        - No class
    definitions:
      shortcode_name: wrapper
      content_key: content_inner
      positional_args:
        - editor_key: class
          type: string

  zen_img:
    template: hugo_shortcode_named_args
    inline: false
    preview:
      view: gallery
      icon: image
      text: Image
      subtext:
        - key: alt
        - No alt
      gallery:
        image:
          - key: src
        text: No preview available
        fit: contain
    definitions:
      shortcode_name: img
      named_args:
        - editor_key: src
          type: string
        - editor_key: class
          type: string
          optional: true
        - editor_key: alt
          type: string
          optional: true
        - editor_key: height
          type: string
          optional: true
        - editor_key: width
          type: string
          optional: true
        - editor_key: link
          type: string
          optional: true
        - editor_key: size
          type: string
          optional: true
        - editor_key: srcset
          type: string
          optional: true
~~~~

## Conclusion

CludCannons takes a lot of work to set up for anything but the simplest sites. The end result is a very competent and pleasant editing environment for your editors.