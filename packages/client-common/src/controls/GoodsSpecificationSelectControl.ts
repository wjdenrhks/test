import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from "@angular/core";
import {
  ISdNotifyPropertyChange, SdNotifyPropertyChange,
  SdOrmProvider, SdSelectControl,
  SdTypeValidate
} from "@simplism/angular";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";

@Component({
  selector: "app-goods-specification-select",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-select [(value)]="value"
               (valueChange)="valueChange.emit($event)"
               [disabled]="disabled"
               [required]="required"
               style="min-width: 100px;"
               #select>
      <sd-dock-container>
        <sd-dock>
          <sd-textfield [(value)]="searchText" placeholder="검색어"></sd-textfield>
        </sd-dock>
        <sd-dock class="sd-padding-xs-sm"
                 *ngIf="pagination.length > 1">
          <sd-pagination [(page)]="pagination.page"
                         [length]="pagination.length"
                         (pageChange)="onPageChange($event)"
                         [displayPageLength]="5"></sd-pagination>
        </sd-dock>

        <sd-busy-container [busy]="busyCount > 0">
          <sd-select-item [value]="undefined" *ngIf="!required">
            <span class="sd-text-color-grey-default">미지정</span>
          </sd-select-item>

          <ng-container *ngFor="let item of items; trackBy: trackByIdFn">
            <sd-select-item [value]="item.specification" [hidden]="item.isDisabled">
              {{ item.specification }}
            </sd-select-item>
          </ng-container>
        </sd-busy-container>
      </sd-dock-container>
    </sd-select>
  `
})
export class GoodsSpecificationSelectControl implements ISdNotifyPropertyChange {

  @ViewChild("select")
  public selectControl?: SdSelectControl;

  @Input()
  @SdTypeValidate(String)
  @SdNotifyPropertyChange()
  public value?: string;

  @Output()
  public readonly valueChange = new EventEmitter<number | undefined>();

  @Input()
  @SdTypeValidate(Boolean)
  public isReceipt?: boolean;

  @Input()
  @SdTypeValidate(Boolean)
  public required?: boolean;

  @Input()
  @SdTypeValidate(String)
  public goodName?: string;

  @Input()
  @SdTypeValidate(Array)
  public items: IGoodsSpecificationControlVM[] = [];

  @Input()
  @SdTypeValidate(Boolean)
  public disabled?: boolean;

  @Output()
  public readonly saveChanges = new EventEmitter<void>();

  @SdNotifyPropertyChange()
  public searchText?: string;

  public lastFilter?: {
    text?: string;
  };
  public id?: number;
  public isOpen?: boolean;

  public busyCount = 0;

  public pagination = {page: 0, length: 0};

  public trackByIdFn = (i: number, item: any) => item.id || item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async onPageChange(page: number): Promise<void> {
    this.pagination.page = page;

    this.busyCount++;

    await this._search();

    this.busyCount--;
    this._cdr.markForCheck();
  }

  private searchTimeout?: number;

  public async sdOnPropertyChange(propertyName: string, oldValue: any, newValue: any): Promise<void> {
    if (propertyName === "value" && newValue) {
      if (!this.items.some(item => item.specification === newValue)) {
        this.busyCount++;

        await this._search();

        this.busyCount--;
        this._cdr.markForCheck();
      }
    }

    if (propertyName === "searchText") {
      this.busyCount++;
      await new Promise<void>(resolve => {
        let currSearchTimeout: number;
        this.searchTimeout = window.setTimeout(async () => {
          if (currSearchTimeout !== this.searchTimeout) {
            resolve();
            return;
          }

          this.isOpen = true;
          await this._search();
          resolve();
        }, 1000);
        currSearchTimeout = this.searchTimeout;
      });
      this.busyCount--;
      this._cdr.markForCheck();
    }
  }

  private async _search(): Promise<void> {
    await this._orm.connectAsync(MainDbContext, async db => {
      let queryable = db.goods;
      if (this.searchText) {
        queryable = queryable.where(item => [
          sorm.equal(item.isDisabled, false),
          sorm.equal(item.name, this.goodName),
          sorm.includes(item.specification, this.searchText!)
        ]);
      }
      else {
        queryable = queryable.where(item => [
          sorm.equal(item.isDisabled, false),
          sorm.equal(item.name, this.goodName),
          sorm.or([sorm.includes(item.specification, this.value)])]);
      }

      this.items = await queryable
        .limit(this.pagination.page * 20, 20)
        .select(item => ({
          specification: sorm.ifNull(item.specification, ""),
          isDisabled: item.isDisabled
        }))
        .distinct()
        .orderBy(item => item.specification)
        .resultAsync();


      const totalCount = await queryable.countAsync();
      this.pagination.length = Math.ceil(totalCount / 20);
    });

    this._cdr.markForCheck();
  }
}

interface IGoodsSpecificationControlVM {
  specification: string;
  isDisabled: boolean;
}