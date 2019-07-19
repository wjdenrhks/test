import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output} from "@angular/core";
import {
  SdOrmProvider,
  SdTypeValidate
} from "@simplism/angular";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";


@Component({
  selector: "app-lot-select",
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
            <sd-select-item [value]="item.id">
              {{ item.lot }}
            </sd-select-item>
          </ng-container>
        </sd-pane>
      </sd-dock-container>
    </sd-select>
  `
})
export class LotSelectControl {
  @Input()
  @SdTypeValidate(Number)
  public value?: number;

  @Input()
  @SdTypeValidate(Boolean)
  public required?: boolean;

  @Input()
  @SdTypeValidate(Boolean)
  public disabled?: boolean;

  @Input()
  public goodId?: number;

  @Output()
  public readonly valueChange = new EventEmitter<number | undefined>();

  @Input()
  @SdTypeValidate(String)
  public text?: string;

  @Output()
  public readonly selectedItemChange = new EventEmitter<ILotVM | undefined>();

  public busy?: boolean;
  public items: ILotVM[] = [];

  public lastFilter?: {
    text?: string;
    goodId: number;
  };

  public page = 0;
  public pageLength = 0;

  private _textChangeTimeout?: number;

  public trackByIdFn = (index: number, item: ILotVM) => {
    return item.id;
  };

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public onValueChange(value?: number): void {
    this.value = value;
    this.valueChange.emit(this.value);

    const selectedItem = value === undefined ? undefined : this.items.single(item => item.id === value);
    this.selectedItemChange.emit(selectedItem);
  }

  public onTextChange(text?: string): void {
    this.text = text;
    this.busy = true;
    window.clearTimeout(this._textChangeTimeout);
    this._textChangeTimeout = window.setTimeout(
      async () => {
        this.lastFilter = {
          text: this.text,
          goodId: this.goodId!
        };

        this.page = 0;

        await this._search();

        this.busy = false;
      },
      100
    );
  }

  private async _search(): Promise<void> {
    await this._orm.connectAsync(MainDbContext, async db => {
      let queryable = db.lotHistory
        .where(item => [
          sorm.equal(item.goodId, this.lastFilter!.goodId)
        ]);

      if (this.lastFilter!.text) {
        queryable = queryable.where(item => [
          sorm.includes(item.lot, this.lastFilter!.text)
        ]);
      }

      this.items = await queryable
        .orderBy(item => item.id)
        .limit(this.page * 20, 20)
        .select(item => ({
          id: item.id!,
          lot: item.lot
        }))
        .resultAsync();

      const totalCount = await queryable.countAsync();
      this.pageLength = Math.ceil(totalCount / 20);
    });

    this._cdr.markForCheck();
  }
}

export interface ILotVM {
  id: number;
  lot: string;
}