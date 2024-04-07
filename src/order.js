import { prisma } from './database.js'

export async function createOrder(orderText) {
  const newOrder = {
    id: 8,
    text: `const Фeйк заявка = ${orderText}`,
    createdAt: 20240407,
    updatedAt: 20240407
  }
  try {
    // const newOrder = await prisma.order.create({
    //   data: {
    //     text: orderText
    //   }
    // })

    return newOrder
    // return orderText
  } catch (error) {
    console.log('Ошибка в createOrder', error)
    return error
  }
}
