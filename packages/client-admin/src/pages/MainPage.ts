import {ChangeDetectionStrategy, Component, OnInit} from "@angular/core";

@Component({
  selector: "app-main",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-topbar-container>
      <sd-topbar class="sd-background-secondary-darkest">
        <h4>메인화면</h4>
      </sd-topbar>
      
    </sd-topbar-container>`
})
export class MainPage implements OnInit {

  public async ngOnInit(): Promise<void> {
  }
}
