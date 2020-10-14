const Fs = require('fs');
const Path = require('path');
const { PassThrough } = require('stream');
const Throttle = require('throttle');
const { ffprobeSync } = require('@dropb/ffprobe');

const { extname } = require('path');

const readDir = () => Fs.readdirSync(process.cwd(), { withFileTypes: true });
const isMp3 = item => item.isFile && extname(item.name) === '.mp3';
const readSongs = () => readDir().filter(isMp3).map((songItem) => songItem.name);
const generateRandomId = () => Math.random().toString(36).slice(2);

var sinks = new Map()
var songs = readSongs()
var currentSong = null;

const makeResponseSink = () => {
    const id = generateRandomId();
    const responseSink = PassThrough();
    sinks.set(id, responseSink);
    return { id, responseSink };
}

const removeResponseSink = (id) => {
    sinks.delete(id);
}

const broadcastToEverySink = (chunk) => {
    for (const [, sink] of sinks) {
        sink.write(chunk);
    }
}

const getBitRate = (song) => {
    // try {
    //     const bitRate = ffprobeSync(Path.join(process.cwd(), song)).format.bitrate;
    //     return parseInt(bitRate);
    // }
    // catch (err) {
        return 128000; // reasonable default, 128kbp
    // }
}

const playLoop = (index) => {
    if (index >= songs.length) {
        index = 0;
    }
    console.log('helo?')
    currentSong = songs[index];

    const bitRate = getBitRate(currentSong);
    const songReadable = Fs.createReadStream(currentSong);

    const throttleTransformable = new Throttle(128000);
    throttleTransformable.on('data', (chunk) => broadcastToEverySink(chunk));
    throttleTransformable.on('end', () => playLoop(index + 1));

    songReadable.pipe(throttleTransformable);
}

const startStreaming = () => {
    // start with first
    playLoop(0);
}

module.exports = { makeResponseSink, removeResponseSink, startStreaming }