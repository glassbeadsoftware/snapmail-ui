# snapmail-ui
the user interface for SnapMail app, see [snapmail-dna](https://github.com/ddd-mtl/snapmail-dna) for backend

### UI

Developing the UI is simple. You will need to already be running the Holochain Conductor in
order to also develop the UI, since they are now coupled.

> **Prerequisite** have nodejs installed

Open a terminal to this folder

Run the following command
```
npm install
```

Now run
```
npm start
```

A browser window will open, displaying the UI.

#### Nix option

Use the nix shell to have npm installed and run npm install and start.

```shell
nix-shell --run snapmail-ui
```

####  UI Dev Resources

- [webpack](https://webpack.js.org/guides/getting-started/)
