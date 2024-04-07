import { prisma } from './database.js'

export async function createOrder(orderText) {
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
