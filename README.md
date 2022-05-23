# next-typescript

[![from the basement.](https://basement.studio/gh-badge.svg)](https://basement.studio)

The objective of this boilerplate is to set up everything the developer will need (in terms of configuration) to start a next + typescript project. Eslint, prettier and husky are configured to work independent of the user's IDE configuration (as long as it's vscode).

## Featured Aspects of the Stack

- [TypeScript](https://www.typescriptlang.org/)
- [Next.js](https://nextjs.org/)

## Things to Note

- It comes with Inter (it's better to host fonts here rather than getting them from google fonts).
- Pages, components, etc... are located under `/src`. If you are changing this, be sure to also update `tsconfig.json`'s `baseUrl`.

## Get Started

1. Install yarn:

   ```
   npm install -g yarn
   ```

2. Install the dependencies with:

   ```
   yarn
   ```

3. Start developing and watch for code changes:

   ```
   yarn dev
   ```

## Important Things to Do

- [ ] Check out `.env.example` for required environment variables to run the project.
- [ ] Add favicons. (Re)Place in `./public`: _32x32_ `favicon.ico`, _perfect square_ `favicon.svg` and `favicon-dark.svg` (_dark theme_), _512x512_ `icon-512.png`, _192x192_ `icon-192.png`, _180x180_ `apple-touch-icon.png`. You can use something [like this](https://realfavicongenerator.net/) for some (better to use Gimp, Photoshop, or any graphics editor; read more about it [here](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs)).
- [ ] Delete `console.log(basementLog)` if not wanted — it's under `_app.tsx`.
- [ ] Replace the contents of this file (`README.md`) with the contents of the `README.example.md` file — make sure to adapt it to your project's specific needs. Finally, delete the old `README.example.md` file.

---

If you find you need to make extra config to make this work more seamlessly, feel free to submit a PR suggesting your changes. Our focus is to get you up and running with the least steps and burden as possible.

---

![cover image](https://github.com/basementstudio/next-typescript/raw/main/public/og.png 'We Make Cool Sh*t That Performs')
