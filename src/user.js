import { prisma } from './database.js'

export async function createUser(telegramId, chatId, userName) {
  try {
    const newUser = await prisma.user.create({
      data: {
        telegramId: telegramId,
        chatId: chatId,
        userName: userName
      }
    })

    return newUser
  } catch (error) {
    console.log('Ошибка в createUser', error)
    return error
  }
}

export async function getUser(chatId) {
  try {
    const user = await prisma.user.findUnique({ where: { chatId } })
    return user
  } catch (error) {
    console.log('Ошибка в getUser', error)
    return error
  }
}

export async function sendOrderToUsers(orderId, orderText, authorId) {
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

export async function assignUserToOrder(userId, orderId) {
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

export async function getUsersForOrder(orderId) {
  const orderExecutors = await prisma.orderExecutor.findMany({
    where: { orderId: orderId },
    include: { user: true } // Предполагаем, что у вас есть связь между OrderExecutor и User
  })
  return orderExecutors.map((oe) => oe.user)
}
