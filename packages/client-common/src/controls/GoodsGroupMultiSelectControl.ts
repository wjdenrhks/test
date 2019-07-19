import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output
} from "@angular/core";
import {
  ISdNotifyPropertyChange,
  SdNotifyPropertyChange,
  SdOrmProvider,
  SdTypeValidate
} from "@simplism/angular";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";

@Component({
  selector: "app-goods-group-multi-select",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-multi-select [(value)]="value" (open)="onOpen()"
                     (valueChange)="valueChange.emit($event)"
                     [disabled]="disabled">
      <sd-dock-container>
        <sd-dock class="sd-padding-sm-default sd-background-grey-lightest" *ngIf="pagination.length > 1">
          <sd-pagination [page]="pagination.page" [length]="pagination.length"
                         (pageChange)="onPageClick($event)"></sd-pagination>
        </sd-dock>
        <!--<sd-dock>
          <sd-checkbox [(value)]="isAll" (valueChange)="onChangeValues()"> 전체선택 </sd-checkbox>
        </sd-dock>-->
        <ng-container *ngFor="let item of items; trackBy: trackByIdFn">
          <sd-multi-select-item [value]="item.id"
                                *ngIf="!item.isDisabled">
            {{ item.specification }}
          </sd-multi-select-item>
        </ng-container>
      </sd-dock-container>
    </sd-multi-select>
  `
})
export class GoodsGroupMultiSelectControl implements ISdNotifyPropertyChange {
  @Input()
  @SdTypeValidate(Array)
  @SdNotifyPropertyChange()
  public value?: number[];

  @Input()
  @SdTypeValidate(Boolean)
  public required?: boolean;

  @Input()
  @SdTypeValidate(String)
  public selectedGoodsName?: string;

  @Input()
  @SdTypeValidate(Boolean)
  public disabled?: boolean;

  @Output()
  public readonly valueChange = new EventEmitter<number[]>();

  public items: IEmployeeVM[] = [];

  public busyCount = 0;
  public isAll = false;
  public lastFilter?: {
    text?: string;
  };

  public pagination = {page: 0, length: 0};

  public trackByIdFn = (i: number, item: any) => item.id || item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async sdOnPropertyChange(propertyName: string, oldValue: any, newValue: any): Promise<void> {
    if (propertyName === "value" && newValue && newValue.length > 0) {
      const value = newValue as number[];
      const hasNotExistsId = value.some(item => !this.items.map(item1 => item1.id).includes(item));
      if (hasNotExistsId) {
        await this._search(newValue);
      }
      this._cdr.markForCheck();
    }
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
    this._cdr.markForCheck();
  }

  public async onOpen(): Promise<void> {
    await this._search();
    this._cdr.markForCheck();
  }

  public async onChangeValues(): Promise<void> {

  }

  private async _search(ids?: number[]): Promise<void> {
    this.busyCount++;

    await this._orm.connectAsync(MainDbContext, async db => {
      const queryable = db.goods
        .where(item => [
          sorm.notNull(item.specification),
          ids
            ? sorm.in(item.id, ids || [])
            : sorm.equal(item.name, this.selectedGoodsName || "")
        ])
        .groupBy(item => [item.id, item.name, item.specification, item.isDisabled])
        .select(item => ({
          id: item.id!,
          name: item.name,
          specification: sorm.ifNull(item.specification, ""),
          isDisabled: item.isDisabled
        }));

      this.items = [];
      this.items = this.items
        .filter(item => (this.value || []).includes(item.id))
        .concat(
          await queryable
            .orderBy(item => item.specification)
            .resultAsync()
        )
        .distinct();
    });

    this.busyCount--;

    this._cdr.markForCheck();
  }

}

interface IEmployeeVM {
  id: number;
  name: string;
  specification: string;
  isDisabled: boolean;
}

