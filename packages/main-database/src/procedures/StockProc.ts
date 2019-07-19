import {sorm} from "@simplism/orm-query";
import {DateOnly} from "@simplism/core";
import {MainDbContext} from "../MainDbContext";

export class StockProc {
  public static async modifyStock(db: MainDbContext, companyId: number, goodId: number, quantity?: number, lotId?: number, warehouseId?: number, formula?: string, rating?: "A" | "B" | "C" | "공통", productionItemId?: number): Promise<void> {
    const isGoodsItem = await db.stock
      .include(item => item.lot)
      .where(item => [
        sorm.equal(item.lot!.isNotStock, false),
        sorm.equal(item.goodsId, goodId),
        sorm.equal(item.lotId, lotId),
        sorm.equal(item.warehouseId, warehouseId)
      ])
      .singleAsync();

    //INSERT
    if (!isGoodsItem) {
      await db.stock.insertAsync({
        companyId,
        goodsId: goodId,
        productionItemId,
        lotId,
        warehouseId: warehouseId!,
        quantity: sorm.formula(
          0,
          formula!,
          quantity!
        ),
        rating: rating!,
        stockDate: new DateOnly()
      });
    }
    //UPDATE
    else {
      await db.stock
        .include(item => item.lot)
        .where(item => [
          sorm.equal(item.lot!.isNotStock, false),
          sorm.equal(item.goodsId, goodId),
          sorm.equal(item.lotId, lotId),
          sorm.equal(item.warehouseId, warehouseId)
        ])
        .updateAsync(() => ({
          quantity: sorm.formula(
            isGoodsItem.quantity,
            formula!,
            quantity
          ),
          stockDate: new DateOnly()
        }));
    }

    await db.stock.where(item => [sorm.equal(item.lotId, lotId), sorm.equal(item.quantity, 0)]).deleteAsync();
  }

  public static async modifyAvailableStock(db: MainDbContext, companyId: number, goodId: number, quantity?: number, formula?: string): Promise<void> {
    const isGoodsItem = await db.availableStock
      .where(item => [
        sorm.equal(item.goodId, goodId)
      ])
      .singleAsync();

    //INSERT
    if (!isGoodsItem) {
      await db.availableStock.insertAsync({
        companyId,
        goodId,
        quantity: sorm.formula(
          0,
          formula!,
          quantity!
        )
      });
    }
    //UPDATE
    else {
      await db.availableStock
        .where(item => [
          sorm.equal(item.goodId, goodId)
        ])
        .updateAsync(() => ({
          quantity: sorm.formula(
            isGoodsItem.quantity,
            formula!,
            quantity
          )
        }));
    }
  }

}

/*
interface IStockProcVM {
  goodId: number | undefined;
  goodRating: "A" | "B" | "C" | "공통";
  warehouseId: number | undefined;
  warehouseRating: "A" | "B" | "C" | "공통";
  quantity: number | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
}
*/
