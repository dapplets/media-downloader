# Media Downloader

This project was developed at the [**Liberate Data Week Hackathon**](https://medium.com/ethereum-swarm/liberate-data-week-join-the-hackathon-7291bd307e32) in 8–14 February 2021.

We created a Dapplet augmenting the YouTube website to download the video to Swarm and then to attach it to any existing tweet.

Next versions of the Media Downloader may download any type of content to Swarm or FairOS and attach it to any other content elements in web (specific content adapter required). 

## Getting Started

Live example is available on YouTube website with installed [Dapplet Extension](https://github.com/dapplets/dapplet-extension).

Video demo is available in [docs directory](https://github.com/dapplets/media-downloader/raw/master/docs/demo.mp4).

To start development you need to execute the following commands:

```
npm i
npm start
```

It will launch all projects in parallel, except the smart contract project.

Next to connect two development servers to the extension via popup -> developer tab.

Addresses of dev servers:
* dapplet-youtube - `http://localhost:3001/dapplet.json`
* dapplet-twitter - `http://localhost:3003/dapplet.json`
* adapter - `http://localhost:3002/dapplet.json`

Also the dapplet uses the overlay by following address:
* overlay-youtube - `https://localhost:3004`
* overlay-twitter - `https://localhost:3005`

After that the Media Downloader dapplet will be available in the store of the extension (popup -> dapplets tab).

## Built With
* [Dapplets Platform](https://github.com/dapplets/dapplet-extension)
* [FairOS](https://fairos.io)
* [Ethereum Swarm](https://swarm.ethereum.org)
* [Ethereum](http://ethereum.org)
* [Bee JS Library](https://github.com/ethersphere/bee-js)
* [TypeScript](https://www.typescriptlang.org)
* [React.js](https://reactjs.org)

## Authors
* **Alexander Sakhaev** - *Initial work* - [alsakhaev](https://github.com/alsakhaev)
* **Dmitry Palchun** - *Initial work* - [ethernian](https://github.com/ethernian)
