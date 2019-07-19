import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {AppSharedModule} from "../AppSharedModule";
import {EmployeePage} from "./base-info/EmployeePage";
import {BaseTypePage} from "./base-info/BaseTypePage";
import {GoodsPage} from "./base-info/GoodsPage";
import {EquipmentPage} from "./base-info/EquipmentPage";
import {WarehousePage} from "./base-info/WarehousePage";
import {PartnerPage} from "./base-info/PartnerPage";
import {GoodsBuildPage} from "./base-info/GoodsBuildPage";
import {ProductionInfoPage} from "./base-info/ProductionInfoPage";
import {EmployeePermissionPage} from "./base-info/EmployeePermissionPage";
import {GoodsGroupPage} from "./base-info/GoodsGroupPage";
import {GoodsBuildGroupPage} from "./base-info/GoodsBuildGroupPage";

@NgModule({
  imports: [
    AppSharedModule,
    RouterModule.forChild([
      {path: "base-type", component: BaseTypePage},
      {path: "partner", component: PartnerPage},
      {path: "goods", component: GoodsPage},
      {path: "goods-build", component: GoodsBuildPage},
      {path: "goods-build-group", component: GoodsBuildGroupPage},
      {path: "goods-group", component: GoodsGroupPage},
      {path: "employee", component: EmployeePage},
      {path: "employee-permission", component: EmployeePermissionPage},
      {path: "production-info", component: ProductionInfoPage},
      {path: "equipment", component: EquipmentPage},
      {path: "warehouse", component: WarehousePage}
    ])
  ],
  declarations: [
    BaseTypePage,
    PartnerPage,
    GoodsPage,
    GoodsGroupPage,
    GoodsBuildPage,
    GoodsBuildGroupPage,
    EmployeePage,
    EmployeePermissionPage,
    ProductionInfoPage,
    EquipmentPage,
    WarehousePage
  ]
})
export class BaseInfoLazyModule {
}
