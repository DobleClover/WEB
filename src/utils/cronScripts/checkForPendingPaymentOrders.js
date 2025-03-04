import cron from "node-cron";
import db from "../../database/models/index.js";
import { checkOrderPaymentExpiration } from "../../controllers/api/apiOrderController.js";


// Chequear cada 6hs
export default cron.schedule('0 */6 * * *', async () => { //Cada 6hs
  try {
    // Busco las ordenes con orderStatus 5
    const ordersWithPendingPayment = await db.Order.findAll({
        where: {
            order_status_id: 5
        }
    });
    if(!ordersWithPendingPayment.length)return
    //Aca voy por cada orden y la mando a chequear por si expiro el pago
    for (let i = 0; i < ordersWithPendingPayment.length; i++) {
        const order = ordersWithPendingPayment[i];
        await checkOrderPaymentExpiration(order);
    }
    return;
  } catch (error) {
    console.log(`Falle en checkForPendingPaymentOrders: ${error}`);
    return console.log(error);
  }
});
