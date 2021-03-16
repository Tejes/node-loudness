const execa = require('execa')

let defaultDeviceCache = null
const reDefaultSink = /^Default sink name: (.*)$/im
const reVolume = /volume:[^\n]*(.{3})%/i
const reMuted = /muted: (\S+)/i

async function exec (cmd, ...args) {
  return (await execa(cmd, args)).stdout
}

async function getDefaultSink () {
  if (defaultDeviceCache) return defaultDeviceCache

  return (defaultDeviceCache = reDefaultSink.exec(await exec('pacmd', 'stat'))[1])
}

async function getInfo () {
  const list = await exec('pacmd', 'list-sinks')
  const sink = await getDefaultSink()

  const sinkStart = list.indexOf(`name: <${sink}>`)
  const sinkEnd = list.indexOf('name: ', sinkStart + 1)
  const sinkText = list.substring(sinkStart, sinkEnd > 0 ? sinkEnd : undefined)

  return {
    volume: Number(reVolume.exec(sinkText)[1]),
    muted: reMuted.exec(sinkText)[1] === 'yes'
  }
}

module.exports = {
  getInfo: getInfo,
  getVolume: async () => (await getInfo()).volume,
  setVolume: async (val) => await exec('pactl', 'set-sink-volume', '@DEFAULT_SINK@', Number(val) + '%'),
  getMuted: async () => (await getInfo()).muted,
  setMuted: async (val) => await exec('pactl', 'set-sink-mute', '@DEFAULT_SINK@', val ? '1' : '0')
}
