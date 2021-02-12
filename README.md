# Media Downloader
Download videos from YouTube and upload them to Swarm

## Getting Started

Live example is available on YouTube website with installed [Dapplet Extension](https://github.com/dapplets/dapplet-extension).

To start development you need to run three terminals simultaneously:

```
cd dapplet
npm i
npm start
```

```
cd adapter
npm i
npm start
```

```
cd overlay
npm i
npm start
```

Next to connect two development servers to the extension via popup -> developer tab.

Addresses of dev servers:
* dapplet - `http://localhost:3001/dapplet.json`
* adapter - `http://localhost:3002/dapplet.json`

Also the dapplet uses the overlay by following address:
* overlay - `https://localhost:3003`

After that the Media Downloader dapplet will be available in the store of the extension (popup -> dapplets tab).