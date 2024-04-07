import { prisma } from './database.js'

export async function createOrder(orderText) {
  // const newOrder = {
  //   id: 8,
  //   text: `const Фeйк заявка = ${orderText}`,
  //   createdAt: 20240407,
  //   updatedAt: 20240407
  // }
  try {
    const newOrder = await prisma.order.create({
      data: {
        text: orderText
      }
    })

    return newOrder
    // return orderText
  } catch (error) {
    console.log('Ошибка в createOrder', error)
    return error
  }
}

export async function getPotentialExecutorIdOrder(orderId, executorId) {
  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    select: { potentialExecutors: true }
  })
  const isExecutorId = order.potentialExecutors.includes(executorId)

  return isExecutorId
}

export async function addPotentialExecutor(bot, data) {
  const { orderId, executorId } = data
  // console.log(1, 'orderId', typeof orderId)
  // console.log(2, 'executorId', typeof executorId)
  // Получаем текущий список потенциальных исполнителей
  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    select: { potentialExecutors: true }
  })

  console.log(1, 'addPotentialExecutor', order)
  if (!order) return
  // Проверяем, существует ли уже такой исполнитель в списке
  if (order.potentialExecutors.includes(executorId)) {
    console.log('Исполнитель уже добавлен в список потенциальных исполнителей.')
    bot.sendMessage(executorId, `Нет смысла жать повторно`)
    return
  }

  // Добавляем нового потенциального исполнителя
  await prisma.order.update({
    where: { id: Number(orderId) },
    data: {
      potentialExecutors: {
        set: [...order.potentialExecutors, executorId]
      }
    }
  })

  console.log(
    2,
    'Исполнитель успешно добавлен в список потенциальных исполнителей.'
  )
}
