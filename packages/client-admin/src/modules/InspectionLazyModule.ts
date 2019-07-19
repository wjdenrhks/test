import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {AppSharedModule} from "../AppSharedModule";
import {ReceiptInspectionPage} from "./inspection/ReceiptInspectionPage";
import {FirstMiddleLastInspectionPage} from "./inspection/FirstMiddleLastInspectionPage";
import {QcInspectionPage} from "./inspection/QcInspectionPage";
import {ChartsModule} from "ng2-charts";
import "chart.js";
import "chartjs-plugin-annotation";


@NgModule({
  imports: [
    ChartsModule,
    AppSharedModule,
    RouterModule.forChild([
      {path: "first-middle-last-inspection", component: FirstMiddleLastInspectionPage},
      {path: "qc-inspection", component: QcInspectionPage},
      {path: "receipt-inspection", component: ReceiptInspectionPage}

    ])
  ],
  declarations: [
    FirstMiddleLastInspectionPage,
    QcInspectionPage,
    ReceiptInspectionPage
  ]
})
export class InspectionLazyModule {
}
