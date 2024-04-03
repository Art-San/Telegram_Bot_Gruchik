import TelegramBot from 'node-telegram-bot-api'
import * as dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

dotenv.config()

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

// ====================== Module BOTa =====================
const start = async () => {
  bot.setMyCommands([
    { command: '/start', description: 'Начальное приветствие' },
    { command: '/info', description: 'Получить информацию о пользователе' },
    { command: '/zakaz', description: 'Размещение заказа' }
  ])

  bot.on('message', async (msg) => {
    console.log(0, msg)
    const text = msg.text
    const telegramId = String(msg.from.id)
    const chatId = String(msg.chat.id)
    const userName = msg.from.username
      ? `@${msg.from.username}`
      : `${msg.from.first_name} ${msg.from.last_name}`

    try {
      if (text === '/start') {
        try {
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

          return bot.sendMessage(chatId, `команда старт работает только раз`)
        } catch (error) {
          console.log(1, 'error', error)
        }
      }

      if (text === '/info') {
        const user = await getUser(chatId)

        return bot.sendMessage(
          chatId,
          `Ваше имя ${user.userName} и ${
            user.isAdmin ? 'вы админ' : 'вы не админ'
          }`
        )
      }

      if (text === '/zakaz') {
        const users = await getAllUsers()

        users.map((user) => {
          return bot.sendMessage(user.chatId, 'Новый заказ')
        })
      }

      return bot.sendMessage(chatId, `Не понимаю я тебя, пробуй еще раз`)
    } catch (error) {
      console.log(error)
      return bot.sendMessage(chatId, `Произошла ошибка 2: ${error.message}`)
    }
  })

  // ===================
  bot.on('callback_query', async (msg) => {
    console.log(11, msg)
    const data = msg.data
    const chatId = String(msg.message.chat.id)

    if (data === '/again') {
      return bot.sendMessage(chatId, `Команда again`)
    }

    // const user = await prisma.user.findUnique({ where: { chatId } })
    // const user = await getUser(chatId)

    // Обновляем оба поля в базе данных
    // await prisma.user.update({
    // 	where: { chatId: chatId },
    // 	data: {
    // 		right: user.right,
    // 		wrong: user.wrong,
    // 	},
    // })
  })
}

// ===================== отдельные fun  =====================

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

// start()
start().then(() => {
  getAllUsers()
    .then((users) => {
      console.log(1, users)
    })
    .catch((error) => {
      console.error('Ошибка при получении всех пользователей:', error)
    })
})
