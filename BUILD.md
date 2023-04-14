Ensure you have [node.js](https://nodejs.org/en/download) and [Git](https://gitforwindows.org/) installed, then navigate to
any directory you want to build the project in, and execute the below commands 1 by 1 using PowerShell (or the shell of
your choice).
```bash
# Clone repo
$ git clone https://github.com/Darakah/obsidian-timelines.git
# Install dependencies
$ npm install
# Compile Typescript into 1 main.js
$ npm run build
```

When building a plugin, we use a bunch of external libraries (dependencies) that other people have already built so that
we're not reinventing the wheel. These libraries are downloaded from the `package.json`. Since they are publicly available,
we don't store them with our project, because it would be a waste of space to duplicate the same files across hundreds
of projects. Instead, we give `package.json` instructions about which libraries to download for our projects. That's why
we call them dependencies, because our project depends on those libraries. When the `npm install` command is finished
downloading them, they are stored in the `node_modules` folder.

In order to add our plugin code to Obsidian, we have to compile all those dependencies + our code into a single
JavaScript file. This is done with the `npm run build` command. When it's finished, you should see a `main.js` file
(about 5MB) that contains all the compiled code. Simply copy that along with the `style.css` file into the plugin folder
in your obsidian vault (`My-Obsidian-Vault\.obsidian\plugins\obsidian-timelines`), and voilà, you are done.

![](https://i.imgur.com/yz5lOeQ.gif)

If you encounter an error message stating `You must provide the URL of lib/mappings.wasm` during the build process,
it could be due to an incompatibility between the `source-map` package used by the `obsidian-timelines` plugin and Node.js
version 19. To avoid this issue, it is recommended that you use Node.js version 16. Make sure to install and use Node.js
version 16 before building the project to ensure that the error does not occur.

![](https://i.imgur.com/cDSE6uA.png)
