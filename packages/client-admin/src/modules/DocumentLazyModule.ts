import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {AppSharedModule} from "../AppSharedModule";
import {ProductionInstructionReportPage} from "./document/ProductionInstructionReportPage";
import {ScrapStatusPage} from "./document/ScrapStatusPage";
import {DatabaseDefinitionPage} from "./document/DatabaseDefinitionPage";
import {PurchaseStatusPage} from "./document/PurchaseStatusPage";
import {EquipmentProductionPersonnelStatusPage} from "./document/EquipmentProductionPersonnelStatusPage";
import {GroupLossStatusPage} from "./document/GroupLossStatusPage";
import {GroupProductionStatusPage} from "./document/GroupProductionStatusPage";
import {EquipmentInputMaterialStatusPage} from "./document/EquipmentInputMaterialStatusPage";
import {QuarterlyProductionStatusPage} from "./document/QuarterlyProductionStatusPage";
import {GoodScrapStatusPage} from "./document/GoodScrapStatusPage";
import {ProductionLossStatusPage} from "./document/ProductionLossStatusPage";
import {ChartsModule} from "ng2-charts";
import "chart.js";
import "chartjs-plugin-annotation";
import {RewindStatusPage} from "./document/RewindStatusPage";

@NgModule({
  imports: [
    ChartsModule,
    AppSharedModule,
    RouterModule.forChild([
      {path: "production-instruction-report", component: ProductionInstructionReportPage},
      {path: "scrap-status", component: ScrapStatusPage},
      {path: "good-scrap-status", component: GoodScrapStatusPage},
      {path: "production-loss-status", component: ProductionLossStatusPage},
      {path: "quarterly-production-status", component: QuarterlyProductionStatusPage},
      {path: "equipment-input-material-status", component: EquipmentInputMaterialStatusPage},
      {path: "group-production-status", component: GroupProductionStatusPage},
      {path: "group-loss-status", component: GroupLossStatusPage},
      {path: "equipment-production-personnel-status", component: EquipmentProductionPersonnelStatusPage},
      {path: "purchase-status", component: PurchaseStatusPage},
      {path: "rewind-status", component: RewindStatusPage},
      {path: "database-definition", component: DatabaseDefinitionPage}
    ])
  ],
  declarations: [
    ProductionInstructionReportPage,
    ScrapStatusPage,
    GoodScrapStatusPage,
    ProductionLossStatusPage,
    QuarterlyProductionStatusPage,
    EquipmentInputMaterialStatusPage,
    GroupProductionStatusPage,
    GroupLossStatusPage,
    EquipmentProductionPersonnelStatusPage,
    PurchaseStatusPage,
    RewindStatusPage,
    DatabaseDefinitionPage
  ]
})
export class DocumentLazyModule {
}
