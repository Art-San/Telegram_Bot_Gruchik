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

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany()
    return users
  } catch (error) {
    console.log('Ошибка в getAllUsers', error)
    return error
  }
}

export async function getAdminUsers() {
  try {
    const adminUsers = await prisma.user.findMany({
      where: {
        isAdmin: true
      }
    })
    return adminUsers
  } catch (error) {
    console.log('Ошибка при получении getAdminUsers', error)
    return error
  }
}

export async function getUserById(chatId) {
  try {
    const user = await prisma.user.findUnique({ where: { chatId } })
    return user
  } catch (error) {
    console.log('Ошибка в getUser', error)
    return error
  }
}

export async function sendOrderToUsers(bot, orderDetails) {
  const { orderId, orderText, authorId } = orderDetails
  try {
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
            [
              {
                text: 'Принять',
                callback_data: `order_response_${orderId}_${authorId}`
              }
            ]
          ]
        })
      }
      bot.sendMessage(user.chatId, `Заказ № ${orderId}: ${orderText}`, opts)
    })
  } catch (error) {
    console.log('Ошибка в sendOrderToUsers', error)
    return error
  }
}

export async function assignUserToOrder(userId, orderId) {
  console.log(1, userId)
  console.log(2, orderId)
  const user = await prisma.user.findUnique({ where: { chatId: userId } })
  console.log(0, user)
  // if (user) {
  //   await prisma.orderExecutor.create({
  //     data: {
  //       userId: user.id,
  //       orderId: Number(orderId)
  //     }
  //   })
  // }
}

// export async function getUsersForOrder(orderId) {
//   const orderExecutors = await prisma.orderExecutor.findMany({
//     where: { orderId: orderId },
//     include: { user: true } // Предполагаем, что у вас есть связь между OrderExecutor и User
//   })
//   return orderExecutors.map((oe) => oe.user)
// }
