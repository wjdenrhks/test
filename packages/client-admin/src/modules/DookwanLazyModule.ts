import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {AppSharedModule} from "../AppSharedModule";
import {DookwanPage} from "./dookwan/DookwanPage";
import {DooTwoPage} from "./dookwan/DooTwoPage";
import {DooThreePage} from "./dookwan/DooThreePage";
import {DooFourPage} from "./dookwan/DooFourPage";

@NgModule({
  imports: [
    AppSharedModule,
    RouterModule.forChild([
      {path: "dookwan", component: DookwanPage},
      {path: "doo-two", component: DooTwoPage},
      {path: "doo-three", component: DooThreePage},
      {path: "doo-four", component: DooFourPage}
    ])
  ],
  declarations: [
    DookwanPage,
    DooTwoPage,
    DooThreePage,
    DooFourPage
  ]

})
export class DookwanLazyModule {
}
