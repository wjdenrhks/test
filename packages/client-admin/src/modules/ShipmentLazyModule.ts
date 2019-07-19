import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {AppSharedModule} from "../AppSharedModule";
import {ShippingRegisterPage} from "./shipment/ShippingRegisterPage";
import {ShippingPlanPage} from "./shipment/ShippingPlanPage";
import {ShippingHistoryPage} from "./shipment/ShippingHistoryPage";

@NgModule({
  imports: [
    AppSharedModule,
    RouterModule.forChild([
      {path: "shipping-history", component: ShippingHistoryPage},
      {path: "shipping-plan", component: ShippingPlanPage},
      {path: "shipping-register", component: ShippingRegisterPage}
    ])
  ],
  declarations: [
    ShippingHistoryPage,
    ShippingPlanPage,
    ShippingRegisterPage
  ]
})
export class ShipmentLazyModule {
}
