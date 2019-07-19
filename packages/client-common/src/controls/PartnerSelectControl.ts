import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, ElementRef,
  EventEmitter,
  Input,
  Output, ViewChild
} from "@angular/core";
import {
  ISdNotifyPropertyChange, SdNotifyPropertyChange,
  SdOrmProvider, SdSelectControl,
  SdTypeValidate
} from "@simplism/angular";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";

@Component({
  selector: "app-partner-select",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-select [(value)]="value" (open)="onOpen($event)"
               (valueChange)="valueChange.emit($event)"
               [disabled]="disabled"
               [required]="required"
               style="min-width: 100px;" #select>
      <sd-dock-container>
        <sd-dock>
          <sd-textfield #searchText
                        [(value)]="text" placeholder="검색어"></sd-textfield>
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
            <sd-select-item [value]="item.id" [hidden]="item.isDisabled">
              {{ item.name }}
            </sd-select-item>
          </ng-container>
        </sd-busy-container>
      </sd-dock-container>
    </sd-select>
  `
})
export class PartnerSelectControl implements ISdNotifyPropertyChange {
  @ViewChild("select")
  public selectControl?: SdSelectControl;

  @Input()
  @SdTypeValidate(Number)
  @SdNotifyPropertyChange()
  public value?: number;

  @Output()
  public readonly valueChange = new EventEmitter<number | undefined>();

  @ViewChild("searchText", {read: ElementRef})
  public textfieldElRef?: ElementRef<HTMLElement>;

  @Input()
  @SdTypeValidate(Boolean)
  public required?: boolean;

  @Input()
  @SdTypeValidate(Array)
  public items: IPartnerControlVM[] = [];

  @Input()
  @SdTypeValidate(Boolean)
  public disabled?: boolean;

  @SdNotifyPropertyChange()
  public text?: string;

  @Output()
  public readonly saveChanges = new EventEmitter<void>();

  public lastFilter?: {
    text?: string;
  };
  public id?: number;

  public busyCount = 0;

  public pagination = {page: 0, length: 0};

  public trackByIdFn = (i: number, item: any) => item.id || item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async onOpen(): Promise<void> {
    (this.textfieldElRef!.nativeElement.findAll("input")[0] as HTMLInputElement).focus();
  }

  public async onPageChange(page: number): Promise<void> {
    this.pagination.page = page;

    this.busyCount++;

    await this._search();

    this.busyCount--;
    this._cdr.markForCheck();
  }

/*
  public async onOpen(): Promise<void> {
    (this.textfieldElRef!.nativeElement.findAll("input")[0] as HTMLInputElement).focus();
  }
*/

  private searchTimeout?: number;

  public async sdOnPropertyChange(propertyName: string, oldValue: any, newValue: any): Promise<void> {
    if (propertyName === "value" && newValue) {
      if (!this.items.some(item => item.id === newValue)) {
        this.busyCount++;

        await this._search();

        this.busyCount--;
        this._cdr.markForCheck();
      }
    }

    if (propertyName === "text") {
      this.busyCount++;
      await new Promise<void>(resolve => {
        let currSearchTimeout: number;
        this.searchTimeout = window.setTimeout(async () => {
          if (currSearchTimeout !== this.searchTimeout) {
            resolve();
            return;
          }

          await this._search();
          resolve();
        }, 1000);
        currSearchTimeout = this.searchTimeout;
      });
      this.busyCount--;
      this._cdr.markForCheck();
    }
  }

/*
  public onValueChange(value?: number): void {
    this.value = value;
    this.valueChange.emit(this.value);

    const selectedItem = value === undefined ? undefined : this.items.single(item => item.id === value);
    this.selectedItemChange.emit(selectedItem);
  }

  public onTextChange(text?: string): void {
    this.text = text;
    this.id = undefined;
    this.busy = true;
    window.clearTimeout(this._textChangeTimeout);
    this._textChangeTimeout = window.setTimeout(
      async () => {
        this.lastFilter = {
          text: this.text
        };

        this.page = 0;

        await this._search();

        this.busy = false;
      },
      100
    );
  }
*/

  private async _search(): Promise<void> {
    await this._orm.connectAsync(MainDbContext, async db => {
      let queryable = db.partner;
      if (this.text) {
        queryable = queryable.where(item => [
          sorm.equal(item.isDisabled, false),
          sorm.or([sorm.equal(item.id, this.value), sorm.includes(item.name, this.text!)])
        ]);
      }
      else {
        queryable = queryable.where(item => [sorm.or([sorm.equal(item.id, this.value)])]);
      }

      this.items = await queryable
        .orderBy(item => sorm.equal(item.id, this.value))
        .orderBy(item => item.name)
        .limit(this.pagination.page * 20, 20)
        .select(item => ({
          id: item.id!,
          name: item.name,
          isDisabled: item.isDisabled
        }))
        .resultAsync();


      const totalCount = await queryable.countAsync();
      this.pagination.length = Math.ceil(totalCount / 20);
    });

    this._cdr.markForCheck();
  }
}

export interface IPartnerControlVM {
  id: number;
  name: string;
  isDisabled: boolean;
}