# Streams Plugins

This project contains a plugin for Video.js used in Tpstreams.

## Setup

To get started with the project, follow these steps:

### 1. Install Dependencies

First, you need to install the necessary dependencies. Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

Run the following command to install the dependencies:

```sh
npm install
```

### 2. Run the Server

To start the server and serve the static files, use the following command:

```sh
npm start
```

This will start the server at `http://localhost:3000`.

### 3. Minify Files

To minify your files, use the following command. You need to specify the input and output file paths as environment variables.

```sh
INPUT_FILE="input/path/to/yourfile.js" OUTPUT_FILE="output/path/to/yourfile.min.js" npm run minify
```

Replace `input/path/to/yourfile.js` with the path to your input JavaScript file, and `output/path/to/yourfile.min.js` with the desired path for the minified file.


