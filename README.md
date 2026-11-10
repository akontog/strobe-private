# Strobe

## Table of Contents

- [Tech Stack](#tech-stack)
- [Structure](#structure)
- [Requirements](#requirements)
- [Install & Deploy](#install-deploy)

## Tech Stack

- frontend: html, css, js ή ts, react
- node backend
- FastAPI backend
- vision
- data: json
- communication

## Structure

- [Strobe](#strobe)
  - [Table of Contents](#table-of-contents)
  - [Tech Stack](#tech-stack)
  - [Structure](#structure)
    - [Client](#client)
    - [Application Server](#application-server)
    - [Vision Server](#vision-server)
    - [Documentation](#documentation)
    - [node\_modules](#node_modules)
    - [package.json](#packagejson)
    - [agents](#agents)
  - [Requirements](#requirements)
  - [Install Deploy](#install-deploy)
    - [Install](#install)
    - [Client (Vite dev)](#client-vite-dev)
    - [Server](#server)

### Client

Υλοποίηση frontend. Βλέπε και [README](/client/README.md) του client.

### Application Server

Υλοποίηση node backend.  Βλέπε και [README](/server/README.md) του server.

### Vision Server 

Implementation of the tracking workflow. See also the vision [README](/vision/README.md).
  
### Documentation

The `docs` folder contains:

- [Folder with saved sessions](/docs/sessions/)
- [Folder with various documents for use in the experimental](/docs/πειραματικό/)
- [Architecture draft for editing in draw.io](/docs/architecture/)
- [Ideas and brainstorming](/docs/brainstorming.md)
- [Client-server communication protocol](/docs/client-server-protocol.md)
- [Explanation of structural elements/components](/docs/components.md)
- [Guide for adding new features](/docs/deployment.md)
- [Guide to the application's DOM trees](/docs/domtrees.md)
- [Guide for saving sessions to json log files](/docs/sessions.md)
- [Various useful links for technologies used, etc.](/docs/links.md)
- [Application logo](/docs/strobe.svg)




### node_modules

- Libraries
- Packages
- Dependencies

Created via the `npm install` command.

### package.json

List of dependencies (e.g. express, ws) and startup scripts. File [package.json](./package.json) and [package_lock.json](./package-lock.json) with exact versions.

### agents

Operating instructions for the AI Agents, in the file [Agents.md](./AGENTS.md)

## Requirements

- Node.js 18+
- npm

See also the vision server's [README](vision/requirements.txt).

## Install Deploy

### Install

```powershell
npm install
```

Installation. Reading the list of packages from [package.json](package.json), downloading and creating the node_modules folder and the [package-lock.json](package-lock.json) file.

### Client (Vite dev)

```powershell
npm run build:all  
```

The folder client/dist contains build output only.


### Server
```powershell
npm start
```
Runs server/server.js on port 3000 by default.


