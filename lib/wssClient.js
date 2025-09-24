const { cot } = require("@vidterra/tak.js")
const objects = require('./objectcache.js')
const WebSocket = require('ws')
const Pws = require('pws');

const apiKey = process.env.API_KEY
const bbox = (typeof process.env.BBOX !== 'undefined') ? JSON.parse(process.env.BBOX) : [[[-90, -180], [90, 180]]];

const run = () => {

	const socket = new Pws("wss://stream.aisstream.io/v0/stream", WebSocket, {
		pingTimeout: 30 * 1000 // Reconnect if no message received in 30s.
	});

	socket.onopen = function (_) {
		let subscriptionMessage = {
			Apikey: apiKey,
			BoundingBoxes: bbox
		}
		socket.send(JSON.stringify(subscriptionMessage));
	};

	socket.onmessage = function (event) {
		let aisMessage = JSON.parse(event.data)
		objects.store(aisMessage)
	};

}

if (apiKey) {
	run()
}
