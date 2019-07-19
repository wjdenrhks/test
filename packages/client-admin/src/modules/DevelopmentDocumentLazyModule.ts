import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {AppSharedModule} from "../AppSharedModule";
import {DatabaseDefinitionPage} from "./document/DatabaseDefinitionPage";

@NgModule({
  imports: [
    AppSharedModule,
    RouterModule.forChild([
      {path: "database-definition", component: DatabaseDefinitionPage}
    ])
  ],
  declarations: [
    DatabaseDefinitionPage
  ]
})
export class DevelopmentDocumentLazyModule {
}
