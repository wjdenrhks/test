import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output, ViewChild
} from "@angular/core";
import {
  ISdNotifyPropertyChange,
  SdNotifyPropertyChange,
  SdOrmProvider, SdSelectControl,
  SdTypeValidate
} from "@simplism/angular";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";

@Component({
  selector: "app-production-equipment-select",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-select [(value)]="value" (open)="onOpen()"
               (valueChange)="valueChange.emit($event)"
               [disabled]="disabled"
               [required]="required">
      <sd-dock-container>
        <sd-busy-container [busy]="busyCount > 0">
          <sd-select-item  [value]="item.id" *ngFor="let item of equipmentList; trackBy: trackByIdFn">
            {{ item.name }}
          </sd-select-item>
        </sd-busy-container>
      </sd-dock-container>
    </sd-select>
  `
})
export class ProductionEquipmentSelectControl implements ISdNotifyPropertyChange {
  @Input()
  @SdTypeValidate(Number)
  @SdNotifyPropertyChange()
  public value?: number;

  @Input()
  @SdTypeValidate(Boolean)
  public required?: boolean;

  @Input()
  @SdTypeValidate(Array)
  public equipmentList: IProductionEquipmentVM[] = [];

  @Input()
  @SdTypeValidate(Boolean)
  public disabled?: boolean;

  @Input()
  @SdTypeValidate(Number)
  public goodId?: number;

  @Output()
  public readonly valueChange = new EventEmitter<number>();

  @Input()
  @SdTypeValidate(String)
  public text?: string;

  @ViewChild(SdSelectControl)

  @Output()
  public readonly selectedItemChange = new EventEmitter<IProductionEquipmentVM | undefined>();

  public busy?: boolean;

  public id?: number;

  public busyCount = 0;

  public trackByIdFn = (index: number, item: IProductionEquipmentVM) => item.id || item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async sdOnPropertyChange(propertyName: string, oldValue: any, newValue: any): Promise<void> {
    if (propertyName === "value" && newValue) {
      const value = newValue as number;

      if (!this.equipmentList.some(item => item.id === value)) {
        this.busyCount++;

        await this._search();

        this.busyCount--;
        this._cdr.markForCheck();
      }
    }
  }

  public async onOpen(): Promise<void> {
    await this._search();
    this._cdr.markForCheck();
  }

  private async _search(): Promise<void> {
    await this._orm.connectAsync(MainDbContext, async db => {

      this.equipmentList = await db.equipmentByGoods
        .include(item => item.productionInfo)
        .include(item => item.equipments!)
        .orderBy(item => item.equipments!.name)
        .where(item => [
          sorm.equal(item.goodId, this.goodId),
          sorm.equal(item.productionInfo!.isDisabled, false),
          sorm.query("not [equipments].name like '%리와인더%'", Boolean)!,
          sorm.equal(item.equipments!.isDisabled, false)
        ])
        .orderBy(item => item.id)
        .select(item => ({
          id: item.equipmentId,
          name: item.equipments!.name,
          code: item.equipments!.code,
          erpSync: item.equipments!.erpSyncCode,
          isDisabled: item.equipments!.isDisabled
        }))
        .resultAsync();
    });

    this._cdr.markForCheck();
  }
}

interface IProductionEquipmentVM {
  id: number | undefined;
  name: string | undefined;
  code: string | undefined;
  erpSync: number | undefined;
  isDisabled: boolean;
}

