import { prisma } from './database.js'

export async function createOrder(orderText) {
  try {
    console.log(1, 'orderText', orderText)
    // const newOrder = await prisma.order.create({
    //   data: {
    //     text: orderText,

    //   }
    // })

    // return newOrder
    return orderText
  } catch (error) {
    console.log('Ошибка в createUser', error)
    return error
  }
}
