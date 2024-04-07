import TelegramBot from 'node-telegram-bot-api'
import * as dotenv from 'dotenv'
import {
  getUserById,
  sendOrderToUsers,
  assignUserToOrder,
  getUsersForOrder,
  createUser,
  getAdminUsers
} from './user.js'
import { addPotentialExecutor, createOrder } from './order.js'
import { prisma } from './database.js'

dotenv.config()

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

export const start = async () => {
  //   Определение команд бота
  bot.setMyCommands([
    { command: '/start', description: 'Начальное приветствие' },
    { command: '/profile', description: 'Инфа профиля' }
  ])
  //   Обработчик сообщений  ррр
  bot.on('message', async (ctx) => {
    const text = ctx.text
    const telegramId = String(ctx.from.id)
    const chatId = String(ctx.chat.id)
    const userName = ctx.from.username
      ? `@${ctx.from.username}`
      : `${ctx.from.first_name} ${ctx.from.last_name}`

    try {
      if (text === '/start') {
        const user = await getUserById(chatId)
        if (!user) {
          const newUser = await createUser(telegramId, chatId, userName)
          return bot.sendMessage(chatId, `Здравствуйте ${newUser.userName}`)
        }

        return bot.sendMessage(chatId, `Привет ${user.userName}`)
      }

      if (text.startsWith('/addOrder')) {
        const orderText = text.replace('/addOrder', '').trim()
        const user = await getUserById(chatId)
        if (user && user.isAdmin) {
          const newOrder = await createOrder(orderText)
          // console.log(0, newOrder)

          await sendOrderToUsers(bot, {
            orderId: newOrder.id,
            orderText: newOrder.text,
            authorId: telegramId
          })
          return bot.sendMessage(
            chatId,
            `Заказ № ${newOrder.id}: разослан юзерам`
          )
        } else {
          return bot.sendMessage(chatId, 'У вас нет прав.')
        }
      }
    } catch (error) {
      console.log(error)
      return bot.sendMessage(chatId, `Произошла ошибка 2: ${error.message}`)
    }
  })

  //   Обработчик callback_query
  bot.on('callback_query', async (ctx) => {
    const data = ctx.data
    const executorId = String(ctx.from.id)
    const chatId = String(ctx.message.chat.id)
    console.log(0, data)
    console.log(1, chatId)

    if (data.startsWith('order_response_')) {
      const orderId = data.split('_')[2]
      const authorId = data.split('_')[3]
      const user = await getUserById(executorId)
      console.log(0, user)
      if (user) {
        await addPotentialExecutor(bot, {
          orderId,
          executorId
        })

        const opts = {
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                {
                  text: 'Назначить',
                  callback_data: `assign_user_${orderId}_${executorId}`
                }
              ]
            ]
          })
        }

        await bot.sendMessage(
          authorId,
          `Информация о пользователе: ${user.userName}`,
          opts
        )
      } else {
        return bot.sendMessage(chatId, 'Пользователь не найден.')
      }

      return bot.sendMessage(chatId, 'Ожидайте несколько минут.')
    }

    // if (data.startsWith('order_response_')) {
    //   const orderId = data.split('_')[2]
    //   // Предположим, что у вас есть функция getUserByChatId, которая возвращает информацию о пользователе по chatId
    //   const user = await getUserById(chatId)
    //   if (user) {
    //     // Создаем инлайн-клавиатуру с кнопкой "Назначить"

    //     // Отправляем сообщение с информацией о пользователе и кнопкой "Назначить"
    //     await bot.sendMessage(
    //       chatId,
    //       `Информация о пользователе: ${user.userName}`,
    //       opts
    //     )
    //   } else {
    //     return bot.sendMessage(chatId, 'Пользователь не найден.')
    //   }

    //   // Отправляем сообщение о том, что заказ будет обработан
    // }

    // if (data.startsWith('select_order_')) {
    //   const orderId = data.split('_')[2]
    //   const users = await getUsersForOrder(orderId)
    //   if (users.length > 0) {
    //     // Формируем кнопки для выбора пользователя
    //     const keyboard = users.map((user) => [
    //       {
    //         text: user.userName,
    //         callback_data: `assign_user_${orderId}_${user.id}`
    //       }
    //     ])
    //     const opts = {
    //       reply_markup: JSON.stringify({
    //         inline_keyboard: keyboard
    //       })
    //     }
    //     return bot.sendMessage(chatId, 'Выберите исполнителей:', opts)
    //   } else {
    //     return bot.sendMessage(
    //       chatId,
    //       'Нет пользователей, откликнувшихся на заказ.'
    //     )
    //   }
    // }

    // if (data.startsWith('assign_user_')) {
    //   const [_, orderId, userId] = data.split('_')
    //   await assignUserToOrder(userId, orderId)
    //   return bot.sendMessage(
    //     chatId,
    //     'Выбранный пользователь был добавлен к списку исполнителей.'
    //   )
    // }
  })
}
