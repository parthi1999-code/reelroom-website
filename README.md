# Prashi Group — Website Redesign

A static redesign of [prashigroup.com](https://prashigroup.com), styled after the Stellar Management site: big editorial type, full-screen imagery and scroll-driven motion.

## Pages
- `index.html`: Home
- `projects.html`: All projects, with status filters
- `project.html`: Project page (Prashi Residency)
- `about.html`: About
- `contact.html`: Contact
- `news.html`: News & insights

## Run locally
Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## Notes
- Scroll effects live in `assets/fx.js` and `assets/fx.css`. They turn off for visitors who prefer reduced motion.
- Some photos are Unsplash stock (free for commercial use) standing in for real project photography. Prashi project renders and the logo are the client's own.
- Contact and enquiry forms are visual only and aren't wired to a backend.
- Placeholders still to fill: starting price, floor plan, map embeds.
