import TelegramBot from 'node-telegram-bot-api'
import * as dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
// index.js // bot.js // user.js // order.js // database.js
// /my-telegram-bot
//  /src
//     bot.js
//     database.js
//     utils.js
//     /models
//       user.js
//       order.js
//       orderExecutor.js
//     /handlers
//       messageHandlers.js
//       callbackQueryHandlers.js
//  package.json
//  .env
dotenv.config()

const prisma = new PrismaClient()
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

// Функция start для инициализации бота
const start = async () => {
  // Определение команд бота
  bot.setMyCommands([
    { command: '/start', description: 'Начальное приветствие' }
  ])

  // Обработчик сообщений
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
          const newOrder = await prisma.order.create({
            data: {
              text: orderText
            }
          })
          await sendOrderToUsers(newOrder.id, newOrder.text, telegramId)
          return bot.sendMessage(
            chatId,
            `Заказ № ${newOrder.id}: ${newOrder.text}`
          )
        } else {
          return bot.sendMessage(
            chatId,
            'У вас нет прав для добавления заказов.'
          )
        }
      }

      if (text === '/start') {
        const user = await getUser(chatId)
        if (!user) {
          const newUser = await prisma.user.create({
            data: {
              telegramId: telegramId,
              chatId: chatId,
              userName: userName
            }
          })
          await bot.sendPhoto(
            chatId,
            'https://tlgrm.ru/_/stickers/343/879/34387965-f2d4-4e99-b9e9-85e53b0dbd1f/10.jpg'
          )
          return bot.sendMessage(
            chatId,
            `Добро пожаловать в наш бот: ${newUser.userName}`
          )
        }
        return bot.sendMessage(chatId, `Привет ${user.userName}`)
      }

      // Остальная часть кода остается без изменений
    } catch (error) {
      console.log(error)
      return bot.sendMessage(chatId, `Произошла ошибка 2: ${error.message}`)
    }
  })

  // Обработчик callback_query
  bot.on('callback_query', async (msg) => {
    const data = msg.data
    const chatId = String(msg.message.chat.id)

    if (data.startsWith('order_response_')) {
      const orderId = data.split('_')[2]
      await assignUserToOrder(chatId, orderId)
      return bot.sendMessage(chatId, 'Вы были назначены на заказ.')
    }

    if (data.startsWith('select_order_')) {
      const orderId = data.split('_')[2]
      const users = await getUsersForOrder(orderId)
      if (users.length > 0) {
        // Формируем кнопки для выбора пользователя
        const keyboard = users.map((user) => [
          {
            text: user.userName,
            callback_data: `assign_user_${orderId}_${user.id}`
          }
        ])
        const opts = {
          reply_markup: JSON.stringify({
            inline_keyboard: keyboard
          })
        }
        return bot.sendMessage(chatId, 'Выберите исполнителей:', opts)
      } else {
        return bot.sendMessage(
          chatId,
          'Нет пользователей, откликнувшихся на заказ.'
        )
      }
    }

    if (data.startsWith('assign_user_')) {
      const [_, orderId, userId] = data.split('_')
      await assignUserToOrder(userId, orderId)
      return bot.sendMessage(
        chatId,
        'Выбранный пользователь был добавлен к списку исполнителей.'
      )
    }
  })
}

// Функции для работы с пользователями и заказами
async function getUser(chatId) {
  try {
    const user = await prisma.user.findUnique({ where: { chatId } })
    return user
  } catch (error) {
    console.log('Ошибка в getUser', error)
    return error
  }
}

async function sendOrderToUsers(orderId, orderText, authorId) {
  const users = await prisma.user.findMany({
    where: {
      chatId: {
        not: authorId // Исключаем автора заказа
      }
    }
  })

  users.forEach((user) => {
    const opts = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: 'Принять', callback_data: `order_response_${orderId}` }]
        ]
      })
    }
    bot.sendMessage(user.chatId, `Заказ № ${orderId}: ${orderText}`, opts)
  })
}

async function assignUserToOrder(userId, orderId) {
  const user = await prisma.user.findUnique({ where: { chatId: userId } })
  if (user) {
    await prisma.orderExecutor.create({
      data: {
        userId: user.id,
        orderId: Number(orderId)
      }
    })
  }
}

async function getUsersForOrder(orderId) {
  const orderExecutors = await prisma.orderExecutor.findMany({
    where: { orderId: orderId },
    include: { user: true } // Предполагаем, что у вас есть связь между OrderExecutor и User
  })
  return orderExecutors.map((oe) => oe.user)
}

start()
