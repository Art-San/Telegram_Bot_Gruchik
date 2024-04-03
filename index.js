import TelegramBot from 'node-telegram-bot-api'
import * as dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config()

const prisma = new PrismaClient()
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

// Функция start для инициализации бота
const start = async () => {
  // Определение команд бота
  bot.setMyCommands([
    { command: '/start', description: 'Начальное приветствие' },
    { command: '/info', description: 'Получить информацию о пользователе' },
    { command: '/zakaz', description: 'Размещение заказа' }
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
          await sendOrderToUsers(newOrder.id, newOrder.text)
          return bot.sendMessage(chatId, `Заказ добавлен: ${newOrder.text}`)
        } else {
          return bot.sendMessage(
            chatId,
            'У вас нет прав для добавления заказов.'
          )
        }
      }

      // Остальная часть кода остается без изменен
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

async function getAllUsers() {
  try {
    const users = await prisma.user.findMany()
    return users
  } catch (error) {
    console.log('Ошибка в getAllUsers', error)
    return error
  }
}

async function sendOrderToUsers(orderId, orderText) {
  const users = await getAllUsers()
  users.forEach((user) => {
    const opts = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: 'Принять', callback_data: `order_response_${orderId}` }]
        ]
      })
    }
    bot.sendMessage(user.chatId, `Новый заказ: ${orderText}`, opts)
  })
}

async function assignUserToOrder(userId, orderId) {
  const user = await prisma.user.findUnique({ where: { chatId: userId } })
  if (user) {
    await prisma.orderExecutor.create({
      data: {
        userId: user.id,
        orderId: orderId
      }
    })
  }
}

// Запуск бота
start()

// import TelegramBot from 'node-telegram-bot-api'
// import * as dotenv from 'dotenv'
// import { PrismaClient } from '@prisma/client'

// dotenv.config()

// const prisma = new PrismaClient()
// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

// // Функция start для инициализации бота
// const start = async () => {
//   // Определение команд бота
//   bot.setMyCommands([
//     { command: '/start', description: 'Начальное приветствие' },
//     { command: '/info', description: 'Получить информацию о пользователе' },
//     { command: '/zakaz', description: 'Размещение заказа' }
//   ])

//   // Обработчик сообщений
//   bot.on('message', async (msg) => {
//     const text = msg.text
//     const telegramId = String(msg.from.id)
//     const chatId = String(msg.chat.id)
//     const userName = msg.from.username
//       ? `@${msg.from.username}`
//       : `${msg.from.first_name} ${msg.from.last_name}`

//     try {
//       if (text.startsWith('/addOrder')) {
//         const orderText = text.replace('/addOrder', '').trim()
//         const user = await getUser(chatId)
//         if (user && user.isAdmin) {
//           const newOrder = await prisma.order.create({
//             data: {
//               text: orderText
//             }
//           })
//           await sendOrderToUsers(newOrder.text)
//           return bot.sendMessage(chatId, `Заказ добавлен: ${newOrder.text}`)
//         } else {
//           return bot.sendMessage(
//             chatId,
//             'У вас нет прав для добавления заказов.'
//           )
//         }
//       }

//       if (text === '/start') {
//         const user = await getUser(chatId)
//         if (!user) {
//           const newUser = await prisma.user.create({
//             data: {
//               telegramId: telegramId,
//               chatId: chatId,
//               userName: userName
//             }
//           })
//           return bot.sendMessage(
//             chatId,
//             `Добро пожаловать в наш бот: ${newUser.userName}`
//           )
//         }
//         return bot.sendMessage(chatId, `команда старт работает только раз`)
//       }

//       if (text === '/info') {
//         const user = await getUser(chatId)
//         return bot.sendMessage(
//           chatId,
//           `Ваше имя ${user.userName} и ${
//             user.isAdmin ? 'вы админ' : 'вы не админ'
//           }`
//         )
//       }

//       if (text === '/zakaz') {
//         const users = await getAllUsers()
//         users.forEach((user) => bot.sendMessage(user.chatId, 'Новый заказ'))
//       }

//       return bot.sendMessage(chatId, `Не понимаю я тебя, пробуй еще раз`)
//     } catch (error) {
//       console.log(error)
//       return bot.sendMessage(chatId, `Произошла ошибка 2: ${error.message}`)
//     }
//   })

//   // Обработчик callback_query
//   bot.on('callback_query', async (msg) => {
//     console.log(0, msg)
//     const data = msg.data
//     const chatId = String(msg.message.chat.id)

//     if (data === 'order_response') {
//       return bot.sendMessage(chatId, 'Ожидайте...')
//     }
//   })
// }

// // Функции для работы с пользователями и заказами
// async function getUser(chatId) {
//   try {
//     const user = await prisma.user.findUnique({ where: { chatId } })
//     return user
//   } catch (error) {
//     console.log('Ошибка в getUser', error)
//     return error
//   }
// }

// async function getAllUsers() {
//   try {
//     const users = await prisma.user.findMany()
//     return users
//   } catch (error) {
//     console.log('Ошибка в getAllUsers', error)
//     return error
//   }
// }

// async function sendOrderToUsers(orderText) {
//   const users = await getAllUsers()
//   users.forEach((user) => {
//     const opts = {
//       reply_markup: JSON.stringify({
//         inline_keyboard: [
//           [{ text: 'Принять', callback_data: 'order_response' }]
//         ]
//       })
//     }
//     bot.sendMessage(user.chatId, `Новый заказ: ${orderText}`, opts)
//   })
// }

// // Запуск бота
// start()
