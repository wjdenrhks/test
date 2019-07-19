import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {AppSharedModule} from "../AppSharedModule";
import {SamplePage2} from "./sample2/SamplePage2";

@NgModule({
  imports: [
    AppSharedModule,
    RouterModule.forChild([
      {path: "sample2", component: SamplePage2}
    ])
  ],
  declarations: [
    SamplePage2
  ]

})
export class SampleLazyModule2 {
}
