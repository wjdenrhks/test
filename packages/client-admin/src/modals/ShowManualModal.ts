import {SdModalBase, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild} from "@angular/core";

@Component({
  selector: "app-show-manual-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-dock-container style="max-width: 800px; max-height: 650px;">
      <sd-busy-container [busy]="busyCount > 0">
        <sd-dock-container>
          <sd-dock class="sd-padding-xs-xs" [position]="'left'">
            <sd-button (click)="movePageLeft()" [inline]="true" style="padding-top: 300px;">
              <<
            </sd-button>
          </sd-dock>
          <sd-dock [position]="'right'" class="sd-padding-xs-xs">
            <sd-button (click)="movePageRight()" [inline]="true" style="padding-top: 300px;">
              >>
            </sd-button>
          </sd-dock>
          <sd-pane class="sd-padding-default" style="max-height: 625px;">
            <div style="display: inline-block; float: left;">
              <img #aa [src]="logo" style="text-align: center; width: 100%; height: 100%;">
            </div>
          </sd-pane>
        </sd-dock-container>
      </sd-busy-container>
    </sd-dock-container>`
})
export class ShowManualModal extends SdModalBase<{ type: string }, undefined> {

  @ViewChild("aa", {read: ElementRef})
  public itemSheetElRef?: ElementRef<HTMLElement>;

  public logo: any;

  public busyCount = 0;
  public seq = 1;
  public lastSeq = 1;

  public typeId: number | undefined;

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public type: string | undefined;

  public constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _toast: SdToastProvider) {
    super();
  }

  public async sdOnOpen(param: { type: string }): Promise<void> {

    this.busyCount++;

    this.type = param.type;
    await this._setLastSeq();
    this._setManualInfo();
    this.busyCount--;
    this._cdr.markForCheck();
  }

  public movePageLeft(): void {
    let seq = this.seq;
    if (--seq >= 1) {
      this.seq--;
      this._setManualInfo();
    }
    else {
      this._toast.info("첫번째 페이지 입니다.");
    }
  }

  public movePageRight(): void {
    let seq = this.seq;
    if (++seq < this.lastSeq) {
      this.seq++;
      this._setManualInfo();
    }
    else {
      this._toast.info("마지막 페이지 입니다.");
    }
  }

  private _setManualInfo(): void {
    try {
      const fileName = this.type + "_" + this.seq + ".png";
      const test = require("../assets/" + fileName); //tslint:disable-line:no-require-imports
      if (test) {
        this.logo = test;
        this._cdr.markForCheck();
      }
      else {
        this._toast.danger("해당 파일이 존재하지 않습니다.");
      }
    }
    catch (err) {
      this._toast.danger("해당 파일이 존재하지 않습니다.");
      this.close();
    }
  }


  public async _setLastSeq(): Promise<void> {
    let seq = 1;
    while (seq !== 0) {
      try {
        const fileName = this.type + "_" + seq + ".png";
        const test = require("../assets/" + fileName); //tslint:disable-line:no-require-imports
        if (test) {
          seq = seq + 1;
        }
      }
      catch (e) {
        this.lastSeq = seq;
        seq = 0;
      }
    }
  }
}
