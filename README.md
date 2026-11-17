# Audioheads — website concept

A scroll-driven, 3D website concept for **Audioheads**, Bengaluru's live event and pro-audio specialists (since 2008): live show production, A/V rental and integration, an authorised Pioneer DJ service centre, and artist management.

## Pages

| Page | File | What it is |
| --- | --- | --- |
| Home | `index.html` | A 3D scroll journey: the speaker, the dive into the canyon, glowing lines that draw as you scroll, the cabinet field and the valley |
| Home — option B | `home-b.html` | An alternative home page in the About page's style: flowing light ribbons and scroll-revealed cards |
| About us | `about.html` | Story, numbers, values and crew |
| Projects | `projects.html` | Interactive map of shows, the service centre and talent cities |
| Contact | `contact.html` | Contact details, enquiry form and address |

## Running it

It's a static site with no build step. Open `index.html` through any static server, for example:

```
python3 -m http.server
```

## How it's built

- Each page keeps its markup in a `<template>` with `{{ holes }}`, `<sc-if>` and `<sc-for>`, plus a small component class. `dc-lite.js` renders it and patches updates with [morphdom](https://github.com/patrick-steele-idem/morphdom).
- 3D scenes use [three.js](https://threejs.org) r128 (`vendor/three.min.js`).
- Fonts load from Google Fonts: Schibsted Grotesk, JetBrains Mono, Tektur, Barlow Semi Condensed.

## Before going live

The contact form doesn't send anything yet. Connect it to a form service or backend before launch; until then, submitting shows a thank-you card with a WhatsApp link.

Third-party code: three.js and morphdom, both MIT licensed.
