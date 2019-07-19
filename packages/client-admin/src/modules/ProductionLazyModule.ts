import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {AppSharedModule} from "../AppSharedModule";
import {ProductionInstructionPage} from "./production/ProductionInstructionPage";
import {ProductionPlanPage} from "./production/ProductionPlanPage";
import "fs";

@NgModule({
  imports: [
    AppSharedModule,
    RouterModule.forChild([
      {path: "production-instruction", component: ProductionInstructionPage},
      {path: "production-plan", component: ProductionPlanPage}
    ])
  ],
  declarations: [
    ProductionInstructionPage,
    ProductionPlanPage
  ]
})
export class ProductionLazyModule {
}
