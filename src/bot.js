import TelegramBot from 'node-telegram-bot-api'
import * as dotenv from 'dotenv'
import {
  getUser,
  sendOrderToUsers,
  assignUserToOrder,
  getUsersForOrder
} from './user.js'
import { createOrder } from './order.js'
import { prisma } from './database.js'

dotenv.config()

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

export const start = async () => {
  //   Определение команд бота
  bot.setMyCommands([
    { command: '/start', description: 'Начальное приветствие' }
  ])
  //   Обработчик сообщений
  bot.on('message', async (msg) => {
    const text = msg.text
    const telegramId = String(msg.from.id)
    const chatId = String(msg.chat.id)
    const userName = msg.from.username
      ? `@${msg.from.username}`
      : `${msg.from.first_name} ${msg.from.last_name}`

    try {
      if (text.startsWith('/addOrder')) {
        const orderText = text.replace('/addOrder', '').trim()
        const user = await getUser(chatId)
        if (user && user.isAdmin) {
          createOrder(orderText).then((result) => {
            /*TODO:*/
            console.log(`Заказ № 10 ${result}`)
            return bot.sendMessage(chatId, `Заказ № 10 ${result}`)
          })
          //   const newOrder = await createOrder(orderText)
        } else {
          return bot.sendMessage(chatId, 'У вас нет прав.')
        }
      }

      if (text === '/start') {
        const user = await getUser(chatId)
        if (!user) {
          const newUser = await createUser(telegramId, chatId, userName)
          return bot.sendMessage(chatId, `Здравствуйте ${newUser.userName}`)
        }

        return bot.sendMessage(chatId, `Привет ${user.userName}`)
      }
    } catch (error) {
      console.log(error)
      return bot.sendMessage(chatId, `Произошла ошибка 2: ${error.message}`)
    }
  })

  //   Обработчик callback_query
  bot.on('callback_query', async (msg) => {
    // Логика обработки callback_query
  })
}
