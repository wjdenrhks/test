import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output} from "@angular/core";
import {
  SdOrmProvider,
  SdTypeValidate
} from "@simplism/angular";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";


@Component({
  selector: "app-goods-name-select",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-select [(value)]="value"
               (valueChange)="onValueChange($event)"
               [disabled]="disabled"
               [required]="required"
               style="min-width: 100px;">
      <sd-dock-container>

        <sd-dock>
          <sd-textfield [(value)]="text"
                        (valueChange)="onTextChange($event)"></sd-textfield>
        </sd-dock>

        <sd-pane>
          <sd-select-item [value]="undefined" *ngIf="!required">
            <span class="sd-text-color-grey-default">미지정</span>
          </sd-select-item>
          <ng-container *ngFor="let item of items; trackBy: trackByIdFn">
            <sd-select-item [value]="item.name" [hidden]="item.isDisabled">
              {{ item.name }}
            </sd-select-item>
          </ng-container>
        </sd-pane>
      </sd-dock-container>
    </sd-select>
  `
})
export class GoodsNameSelectControl {
  @Input()
  @SdTypeValidate(String)
  public value?: string;

  @Input()
  @SdTypeValidate(Boolean)
  public required?: boolean;

  @Input()
  @SdTypeValidate(Boolean)
  public disabled?: boolean;

  @Output()
  public readonly valueChange = new EventEmitter<string | undefined>();

  @Input()
  @SdTypeValidate(String)
  public text?: string;

  @Output()
  public readonly selectedItemChange = new EventEmitter<IGoodsNameControlVM | undefined>();

  public busy?: boolean;
  public items: IGoodsNameControlVM[] = [];

  public lastFilter?: {
    text?: string;
  };

  private _textChangeTimeout?: number;

  public trackByIdFn = (index: number, item: IGoodsNameControlVM) => {
    return item.name;
  };

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public onValueChange(value?: string): void {
    this.value = value;
    this.valueChange.emit(this.value);

    const selectedItem = value === undefined ? undefined : this.items.single(item => item.name === value);
    this.selectedItemChange.emit(selectedItem);
  }

  public onTextChange(text?: string): void {
    this.text = text;
    this.busy = true;
    window.clearTimeout(this._textChangeTimeout);
    this._textChangeTimeout = window.setTimeout(
      async () => {
        this.lastFilter = {
          text: this.text
        };

        await this._search();

        this.busy = false;
      },
      100
    );
  }

  private async _search(): Promise<void> {
    await this._orm.connectAsync(MainDbContext, async db => {
      let queryable = db.goods;

      if (this.lastFilter!.text) {
        queryable = queryable.where(item => [
          sorm.includes(item.name, this.lastFilter!.text)
        ]);
      }

      this.items = await queryable
        .orderBy(item => item.name)
        .limit(0, 20)
        .select(item => ({
          name: item.name,
          isDisabled: item.isDisabled
        }))
        .resultAsync();

    });

    this._cdr.markForCheck();
  }
}

export interface IGoodsNameControlVM {
  name: string;
  isDisabled: boolean;
}