---
title: "Introducing Arkio's Pin Tool"
description: "Archived version of a post I wrote introducing Arkio's Pin Tool as part of Arkio's 1.7 release"
image: ""
publishedAt: "2024-04-29"
---

<Note>
<p>I enjoyed the privilege of leading the design and development of Arkio's new Pin Tool, released in Arkio 1.7.</p>
<p>Following is an archived version of the post I wrote to announce the Pin Tool. It was originally posted on [community.arkio.is](https://community.arkio.is/t/introducing-arkio-s-pin-tool/85).</p>
</Note>

---

Arkio’s new Pin Tool enables you to pin and unpin objects and sections in your model, saving you from making changes that you didn’t intend to make. Pinning an object in your model prevents it from being moved, deleted, or modified—by you or any other editors in your meeting.

<Image src="~/ui.png" plain />

<SmallNote center label="">The Pin Tool is the top-left tool in the quick menu</SmallNote>

Using the Pin Tool is easy—just point at the objects in your model that you want to be pinned and hit the trigger to pin them. While the Pin Tool is active, all of the pinned objects in your model will have an orange box drawn around them, making it obvious what’s pinned and what’s not. Whether you’re working at a small or large scale, the tool enables you easily to pin objects at any distance.

<Image src="~/pinning.gif" plain />

<SmallNote center label="">Pinning objects in the scene using the Pin Tool</SmallNote>

The orange boxes would be a distraction during normal editing, so instead the editing tools will let you know if an object is pinned by showing you the Pin icon. A gray box is also shown around the object, indicating that it cannot be modified.

<Image src="~/pinned.png" plain />

<SmallNote center label="">This object is pinned, you can’t modify it</SmallNote>

## Pinning sections of your model

If you’re done modeling a room—or perhaps an entire building—the thought of individually pinning every object in that room may seem like a daunting task. “Do I have to pin every single thing in that darn room?” Luckily, for all of us, that’s not the case.

When designing the Pin Tool, we wanted to make it possible to pin and unpin large sections of your model with ease. For this reason, we made it so that pinning a room will also pin every object inside of it. The same goes for unpinning.

<Image src="~/pin-room.png" plain />

<SmallNote center label="">Pinning a room in a single action</SmallNote>

Even better, if you want to modify a single object in a pinned room, you don’t need to unpin the room itself. Just unpin the object that you want to modify, make your changes, and pin it again.

Pinning a room does not prevent you from creating new objects inside of that room. Pinning an object only prevents modifications to the object itself.

## What about skyscrapers?

Pinning every object in a room individually would be a tedious task, and so would individually pinning every floor of a 20-story skyscraper individually. Even though the floors of the skyscraper aren’t contained in one another, we felt that a skyscraper should be pinnable in a single action.

For this reason, we designed the Pin Tool such that it also pins/unpins objects that are resting on top of the object-to-be-pinned:

<Image src="~/pin-skyscraper.png" plain />

<SmallNote center label="">Pinning a skyscraper in a single action</SmallNote>

This means that pinning the bottom floor of a skyscraper will also pin every floor above it, and all of the rooms and objects inside of all of the floors.

## Making Arkio a better modeler

These two design decisions—including contained and attached objects in your pin selection—make pinning and unpinning sections of your model and groups of objects a breeze!

We at Arkio are working hard these days on making Arkio a more powerful, stable, and easy-to-use modeler. In doing so, there are a lot of interesting decisions and trade-offs that we have to make. We hope you enjoyed learning about the new Pin Tool and the decisions we made in creating it.

We intend to share more details on the development process here on the community site, so join to the @InsideArkio group to receive notifications about posts from the Arkio team.

Anyway, thanks so much for reading. We hope the new Pin Tool in Arkio 1.7 is of use to you and your team!

— Alex Harri, Senior Software Engineer at Arkio