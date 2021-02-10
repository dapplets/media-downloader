# Media Downloader
Download videos from YouTube and upload them to Swarm

## Getting Started

Live example is available on YouTube website with installed [Dapplet Extension](https://github.com/dapplets/dapplet-extension).

To start development you need to run two terminals simultaneously:

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

Next to connect two these development server to the extension via popup -> developer tab.

Addresses of dev servers:
* dapplet - `https://localhost:3001/dapplet.json`
* adapter - `https://localhost:3002/dapplet.json`

After that the Media Downloader dapplet will be available in the store of the extension (popup -> dapplets tab).