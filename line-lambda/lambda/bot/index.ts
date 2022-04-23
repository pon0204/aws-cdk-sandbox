import axios from 'axios'
import * as Line from '@line/bot-sdk'
import * as Types from '@line/bot-sdk/lib/types'
import * as Lambda from 'aws-lambda'
import * as dayjs from 'dayjs'

interface AnimeData {
  id: string
  title: string
}

const channelAccessToken = process.env.CHANNEL_ACCESS_TOKEN!
const channelSecret = process.env.CHANNEL_SECRET!

const config: Line.ClientConfig = {
  channelAccessToken,
  channelSecret,
}

const client = new Line.Client(config)

const getAnimeDatas = async (year: number): Promise<AnimeData[]> => {
  const res = await axios.get(`http://api.moemoe.tokyo/anime/v1/master/${year}`)
  return res.data
}

const eventHandler = async (event: Types.MessageEvent): Promise<any> => {
  if (
    event.type !== 'message' ||
    event.message.type !== 'text' ||
    !event.source.userId
  ) {
    return null
  }
  if (event.message.text === '今年のアニメは？') {
    const animeDatas = await getAnimeDatas(dayjs().year())
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: animeDatas.map((animeData) => animeData.title).join('\n'),
    })
  } else {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '「今年のアニメは？」と聞いてね',
    })
  }
}

export const handler = async (proxyEevent: Lambda.APIGatewayEvent) => {
  const body: Line.WebhookRequestBody = JSON.parse(proxyEevent.body!)
  await Promise.all(
    body.events.map(async (event) => eventHandler(event as Types.MessageEvent))
  ).catch((err) => {
    console.error(err.Message)
    return {
      statusCode: 500,
      body: 'Error',
    }
  })
  return {
    statusCode: 200,
    body: 'OK',
  }
}
