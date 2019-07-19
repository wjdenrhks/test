import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {AppSharedModule} from "../AppSharedModule";
import {GoodsReceiptPage} from "./goods-transaction/GoodsReceiptPage";
import {StockAdjustmentPage} from "./goods-transaction/StockAdjustmentPage";
import {StockTransferPage} from "./goods-transaction/StockTransferPage";
import {LotTransPage} from "./goods-transaction/LotTransPage";
import {PackingPage} from "./goods-transaction/PackingPage";
import {StockCurrentPage} from "./goods-transaction/StockCurrentPage";
import {StockWarehouseCurrentPage} from "./goods-transaction/StockWarehouseCurrentPage";

@NgModule({
  imports: [
    AppSharedModule,
    RouterModule.forChild([
      {path: "goods-receipt", component: GoodsReceiptPage},
      {path: "lot-trans", component: LotTransPage},
      {path: "packing", component: PackingPage},
      {path: "stock-adjustment", component: StockAdjustmentPage},
      {path: "stock-current", component: StockCurrentPage},
      {path: "stock-warehouse-current", component: StockWarehouseCurrentPage},
      {path: "stock-transfer", component: StockTransferPage}
    ])
  ],
  declarations: [
    GoodsReceiptPage,
    LotTransPage,
    PackingPage,
    StockAdjustmentPage,
    StockCurrentPage,
    StockWarehouseCurrentPage,
    StockTransferPage
  ]
})
export class GoodsTransactionLazyModule {
}
