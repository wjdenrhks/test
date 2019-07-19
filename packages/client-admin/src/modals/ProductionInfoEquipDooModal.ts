import {SdModalBase, SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {EquipmentByGoods, MainDbContext} from "@sample/main-database";
import {EquipmentSearchModal} from "./EquipmentSearchModal";
import {GoodsSearchModal} from "./GoodsSearchModal";

@Component({
  selector: "app-production-info-equipment-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <sd-dock-container style="min-width: 500px;">
      <sd-dock class="sd-padding-sm-default">
        <sd-pagination [page]="pagination.page" [length]="pagination.length"
                       (pageChange)="onPageClick($event)"></sd-pagination>
      </sd-dock>
      <sd-dock class="sd-padding-sm-default" [position]="'bottom'" style="padding-left: 20px;">
        <sd-form [inline]="true">
          <sd-form-item style="text-align: left">
            <sd-button [size]="'sm'" (click)="onAddButtonClick()">
              <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
              행 추가
            </sd-button>
          </sd-form-item>
          <sd-form-item style="text-align: right; padding-left: 300px;">
            <sd-button [type]="'submit'" (click)="onSaveButtonClick()">
              <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
              저장
            </sd-button>
          </sd-form-item>
        </sd-form>
      </sd-dock>
      <sd-busy-container [busy]="busyCount > 0">
        <sd-sheet [id]="'production-info-equipment-modal'" [items]="items" [trackBy]="trackByIdFn">
          <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm" style="text-align: center;">
                <span *ngIf="item.id">{{ item.idSeq }}</span>
                <a *ngIf="!item.id" (click)="onRemoveItemButtonClick(item)">
                  <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                </a>
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'설비'" [fixed]="true">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm" style="text-align: center;">
                {{ item.equipmentName }}
                <a (click)="equipmentSearchhModalOpenButtonClick(item)">
                  <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                </a>
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'수량(Roll)'" [width]="80">
            <ng-template #item let-item="item">
              <sd-textfield [(value)]="item.quantity" [type]="'number'" [disabled]="true"
                            style="text-align: center;"></sd-textfield>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'시간'" [width]="100">
            <ng-template #item let-item="item">
              <sd-textfield [(value)]="item.min" [type]="'number'"></sd-textfield>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'삭제'" [width]="40">
            <ng-template #item let-item="item">
              <div style="text-align: center;">
                <sd-checkbox [(value)]="item.isDeleted" [disabled]="!item.seq"></sd-checkbox>
              </div>
              <!-- <div class="sd-padding-xs-sm" style="text-align: center;">
                 <a *ngIf="!!item.seq" (click)="onRemoveItemButtonClick(item)">
                   <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                 </a>
               </div>-->
            </ng-template>
          </sd-sheet-column>
        </sd-sheet>
      </sd-busy-container>
    </sd-dock-container>
  `
})
export class ProductionInfoEquipDooModal extends SdModalBase<{ goodId?: number; productionInfoId?: number; goodGroupId?: number }, any> {
  public filter: {
    goodId?: number;
    productionInfoId?: number;
    goodGroupId?: number;
  } = {};

  public lastFilter?: {
    goodId?: number;
    productionInfoId?: number;
    goodGroupId?: number;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IProductionInfoEquipDooModalVM[] = [];
  public orgItems: IProductionInfoEquipDooModalVM[] = [];

  public busyCount = 0;

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _appData: AppDataProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _toast: SdToastProvider) {
    super();
  }

  //                               goodId                   id
  public async sdOnOpen(param: { goodId?: number; productionInfoId?: number; goodGroupId?: number }): Promise<void> {
    this.busyCount++;

    this.filter.goodId = param.goodId;
    this.filter.productionInfoId = param.productionInfoId;
    this.filter.goodGroupId = param.goodGroupId;

    await this.onSearchFormSubmit();

    this.busyCount--;
    this._cdr.markForCheck();
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;
    this.lastFilter = Object.clone(this.filter);
    await this._search();
  }

  public async onAddButtonClick(): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "설비 검색", {isMulti: true});
    if (!result) return;
  }

  private async _search(): Promise<void> {
    this.busyCount++;
    
    try{
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        // this.items = await queryable
        //   .include(item => item.equipments)
        //   .orderBy(item => item.id)
        //   .limit(this.pagination.page * 20, 20)
        //   .select(item => ({
        //     id: item.id,
        //     idSeq: sorm.query("ROW_NUMBER() OVER (ORDER BY [TBL].[id] ASC)", Number),
        //     seq: item.seq,
        //     productionInfoId: item.productionInfoId,
        //     equipmentId: item.equipmentId,
        //     equipmentName: item.equipments!.name,
        //     quantity: item.quantity,
        //     min: item.leadTime,
        //     isDeleted: sorm.cast(false, Boolean)
        //   }))
        //   .resultAsync();

        this.items = await  queryable
          .include(item => item.equipments)
          .orderBy(item => item.id)
          .select(item => ({
            id: item.id,
            idSeq: sorm.query("ROW_NUMBER() OVER (ORDER BY [TBL].[id] ASC)", Number),
            productionInfoId : item.productionInfoId,
            seq: item.seq,
            equipmentId : item.equipmentId,
            equipmentName :  item.equipments!.name,
            min : item.leadTime,
            quantity : item.quantity,
            isDeleted: sorm.cast(false, Boolean)
          }))
          .resultAsync();

        this.orgItems = Object.clone(this.items);

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 20);

      });
    }catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.busyCount--;
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<EquipmentByGoods> {
    let queryable = db.equipmentByGoods
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.goodId) {
      queryable = db.equipmentByGoods
        .where(item => [
          sorm.equal(item.goodId, this.lastFilter!.goodId)
        ]);
    }

    if (this.lastFilter!.goodGroupId) {
      queryable = db.equipmentByGoods
        .where(item => [
          sorm.equal(item.goodsGroupId, this.lastFilter!.goodGroupId)
        ]);
    }

    return queryable;
  }


}

interface IProductionInfoEquipDooModalVM {
  id: number | undefined;
  idSeq: number | undefined;
  productionInfoId: number | undefined;
  seq: number | undefined;
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  quantity: number | undefined;
  min: number | undefined;
  isDeleted: boolean;
}
