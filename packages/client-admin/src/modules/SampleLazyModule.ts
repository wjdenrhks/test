import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {AppSharedModule} from "../AppSharedModule";
import {SamplePage} from "./sample/SamplePage";

@NgModule({
  imports: [
    AppSharedModule,
    RouterModule.forChild([
      {path: "sample", component: SamplePage}
    ])
  ],
  declarations: [ //뷰 클래스 정의
    SamplePage
  ]

})
export class SampleLazyModule {
}
