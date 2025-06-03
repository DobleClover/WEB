export function sortProductsByStockAndType(products = []) {
    return [...products].sort((a, b) => {
      const aHasStock = a.totalStock > 0;
      const bHasStock = b.totalStock > 0;
  
      // 1. Primero con stock
      if (aHasStock !== bHasStock) {
        return bHasStock - aHasStock; // con stock primero
      }
  
      // 2. Dentro del mismo grupo de stock: dobleclover (false) antes que dobleuso (true)
      return a.is_dobleuso - b.is_dobleuso; // false (0) antes que true (1)
    });
  }
  