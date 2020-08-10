import { create, decryptMedia, Message, Client } from '@open-wa/wa-automate'
import * as moment from 'moment'

const serverOption = {
  headless: true,
  qrRefresh: 20,
  qrTimeout: 0,
  authTimeout: 0,
  autoRefresh: true,
  devtools: false,
  chacheEnabled: false,
  chromiumArgs: ['--no-sandbox', 'disable-setuid-sandbox'],
  executablePath: '',
  browserRevision: '',
}

const os = process.platform
if (os == 'win32') {
  serverOption['executablePath'] =
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
} else if (os == 'linux') {
  serverOption['browserRevision'] = '737027'
} else if (os == 'darwin') {
  serverOption['executablePath'] =
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
}

create('Init', serverOption).then((client) => {
  console.log('Server Started')

  client.onStateChanged((state) => {
    console.log('Client State', state)
    state == 'CONFLIC' ? client.forceRefocus : null
  })

  client.onMessage((message) => {
    msgHandler(client, message)
  })
})

async function msgHandler(client: Client, message: Message) {
  try {
    const time = moment(message.t).format('DD/MM HH:mm:ss')
    const commands = ['#menu', '#help', '#sticker', '#stiker']
    const cmds = commands.map((x) => x + '\\b').join('|')
    const cmd =
      message.type === 'chat'
        ? message.body.match(new RegExp(cmds, 'gi'))
        : message.type == 'image' && message.caption
          ? message.caption.match(new RegExp(cmds, 'gi'))
          : null

    if (cmd) {
      if (!message.isGroupMsg)
        console.log(
          color('[EXEC]', null),
          color(time, 'yellow'),
          color(cmd[0], null),
          'from',
          color(message.sender.pushname, null)
        )
      if (message.isGroupMsg)
        console.log(
          color('[EXEC]', null),
          color(time, 'yellow'),
          color(cmd[0], null),
          'from',
          color(message.sender.pushname, null),
          'in',
          color(message.chat.name, null)
        )
      const args = message.body.trim().split('')
      const isUrl = new RegExp(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
      )
      switch (cmd[0]) {
        case '#menu':
        case '#help':
          client.sendText(
            message.from,
            'Menu: \n1. #sticker / #stiker: kirim gambar dengan caption atau balas gambar yang sudah dikirim. \n2. #sticker / #stiker spasi url gambar (contoh: #stiker https://avatars2.githubusercontent.com/u/24309806)'
          )
          break
        case '#sticker':
        case '#stiker':
          if (message.isMedia) {
            const mediaData = await decryptMedia(message)
            const imageBase64 = `data:${
              message.mimetype
              };base64,${mediaData.toString('base64')}`
            await client.sendImageAsSticker(message.from, imageBase64)
          } else if (message.quotedMsg && message.quotedMsg.type == 'image') {
            const mediaData = await decryptMedia(message)
            const imageBase64 = `data:${
              message.mimetype
              };base64,${mediaData.toString('base64')}`
            await client.sendImageAsSticker(message.from, imageBase64)
          } else if (args.length == 2) {
            const url = args[1]
            if (url.match(isUrl)) {
              await client
                .sendStickerfromUrl(message.from, url, {
                  method: 'get',
                })
                .catch((err: String) => console.log('Caught exception: ', err))
            } else {
              client.sendText(
                message.from,
                'Maaf, Url yang kamu kirim tidak valid'
              )
            }
          } else {
            client.sendText(
              message.from,
              'Tidak ada gambar! Untuk membuat sticker kirim gambar dengan caption #stiker'
            )
          }
          break
      }
    } else {
      if (!message.isGroupMsg)
        console.log(
          color('[RECIVE]', null),
          color(time, 'yellow'),
          'Message From',
          color(message.sender.pushname, null)
        )
      if (message.isGroupMsg)
        console.log(
          color('[RECIVE]', null),
          color(time, 'yellow'),
          'Message From',
          color(message.sender.pushname, null),
          'in',
          color(message.chat.name, null)
        )
    }
  } catch (error) {
    console.log(color('ERROR! ', 'red'), error)
  }
}

function color(text: String, color: String | null) {
  switch (color) {
    case 'red':
      return '\x1b[31m' + text + '\x1b[0m'
    case 'yellow':
      return '\x1b[33m' + text + '\x1b[0m'
    default:
      return '\x1b[32m' + text + '\x1b[0m' //  green
  }
}

process.on('Somthing went wrong', (err) => {
  console.log('Caught some error : ', err)
})
