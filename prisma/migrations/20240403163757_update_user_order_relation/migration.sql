-- CreateTable
CREATE TABLE "OrderExecutor" (
    "orderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "OrderExecutor_pkey" PRIMARY KEY ("orderId","userId")
);

-- AddForeignKey
ALTER TABLE "OrderExecutor" ADD CONSTRAINT "OrderExecutor_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderExecutor" ADD CONSTRAINT "OrderExecutor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
