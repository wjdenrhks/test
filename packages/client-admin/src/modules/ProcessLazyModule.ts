import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {AppSharedModule} from "../AppSharedModule";
import {CombinationProcessPage} from "./process/CombinationProcessPage";
import {LotHistoryPage} from "./process/LotHistoryPage";
import {ProcessProductionPage} from "./process/ProcessProductionPage";
import {ProcessPushPage} from "./process/ProcessPushPage";
import {WeightMeasurementPage} from "./process/WeightMeasurementPage";
import {ProcessRewindPage} from "./process/ProcessRewindPage";

@NgModule({
  imports: [
    AppSharedModule,
    RouterModule.forChild([
      {path: "combination-process", component: CombinationProcessPage},
      {path: "lot-history", component: LotHistoryPage},
      {path: "process-production", component: ProcessProductionPage},
      {path: "process-rewind", component: ProcessRewindPage},
      {path: "process-push", component: ProcessPushPage},
      {path: "weight-measurement", component: WeightMeasurementPage}

    ])
  ],
  declarations: [
    CombinationProcessPage,
    LotHistoryPage,
    ProcessProductionPage,
    ProcessPushPage,
    ProcessRewindPage,
    WeightMeasurementPage
  ]
})
export class ProcessLazyModule {
}
