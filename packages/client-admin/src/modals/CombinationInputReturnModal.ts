import {SdModalBase, SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {CodeProc, InputGeneralReturn, MainDbContext, StockProc} from "@sample/main-database";
import {DateOnly, DateTime} from "@simplism/core";
import {GoodsSearchModal} from "./GoodsSearchModal";

@Component({
  selector: "app-combination-input-return-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <sd-dock-container style="min-width: 800px;">
      <sd-dock class="sd-padding-sm-default">
        <sd-pagination [page]="pagination.page" [length]="pagination.length"
                       (pageChange)="onPageClick($event)"></sd-pagination>
      </sd-dock>
      <sd-dock class="sd-padding-sm-default" [position]="'bottom'" style="padding-left: 20px;">
        <sd-button (click)="onAddButtonClick()" [inline]="true">
          <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
          행 추가
        </sd-button>
        <div style="float: right; padding-right: 20px;">
          <sd-button (click)="onSaveButtonClick()" [inline]="true">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-button>
        </div>
      </sd-dock>
      <sd-busy-container [busy]="busyCount > 0">
        <sd-sheet [id]="'combination-input-return-modal'" [items]="items" [trackBy]="trackByIdFn">
          <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm" style="text-align: center;">
                <span *ngIf="item.id">{{ item.seq }}</span>
                <a *ngIf="!item.id" (click)="onRemoveItemButtonClick(item)">
                  <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                </a>
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'반납일'">
            <ng-template #item let-item="item">
              <sd-textfield [(value)]="item.returnDate" [type]="'date'"></sd-textfield>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'재료명'">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm">
                {{ item.goodName }}
                <a (click)="goodBuildGoodSearchModalOpenButtonClick(item)">
                  <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                </a>
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'반납 LOT'">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm" style="text-align: center;">
                {{ item.lotName }}
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'수량'" [width]="60">
            <ng-template #item let-item="item">
              <sd-textfield [(value)]="item.quantity" [type]="'number'" [required]="true"></sd-textfield>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'단위'" [width]="40">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm">
                {{ item.unitName }}
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'창고'" [width]="100">
            <ng-template #item let-item="item">
              <sd-select [(value)]="item.warehouseId" [required]="true" [disabled]="!!item.id">
                <sd-select-item *ngFor="let warehouse of warehouseList; trackBy: trackByMeFn"
                                [value]="warehouse.id"
                                [hidden]="warehouse.isDisabled">
                  {{ warehouse.name }}
                </sd-select-item>
              </sd-select>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'작업자'" [width]="80">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm" style="text-align: center;">
                {{ item.createdByEmployeeName }}
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'작업시간'" [width]="100">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm" style="text-align: center;">
                {{ item.createdAtDateTime?.toFormatString('yyyy-MM-dd') }}
              </div>
            </ng-template>
          </sd-sheet-column>
        </sd-sheet>
      </sd-busy-container>
    </sd-dock-container>
  `
})
export class CombinationInputReturnModal extends SdModalBase<{ combinationId: number }, any> {
  public filter: {
    combinationId?: number;
  } = {};

  public lastFilter?: {
    combinationId?: number;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: ICombinationInputReturnModalVM[] = [];
  public orgItems: ICombinationInputReturnModalVM[] = [];

  public busyCount = 0;

  public warehouseList: {
    id: number;
    name: string;
    isDisabled: boolean;
  }[] = [];

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _appData: AppDataProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _toast: SdToastProvider) {
    super();
  }

  public async sdOnOpen(param: { combinationId: number }): Promise<void> {
    this.busyCount++;

    this.filter.combinationId = param.combinationId;
    await this._orm.connectAsync(MainDbContext, async db => {

      this.warehouseList = await db.warehouse
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.isDisabled, false)
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          isDisabled: item.isDisabled
        }))
        .resultAsync();
    });

    await this.onSearchFormSubmit();
    this._cdr.markForCheck();

    this.busyCount--;
    this._cdr.markForCheck();
  }

  public async onAddButtonClick(): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "반납 자재 검색", {isMulti: true});
    if (!result) return;

    for (const resultItem of result || []) {
      if (this.items.filter(item1 => item1.goodId === resultItem.id).length < 1) {
        this.items.insert(0, {
          id: undefined,
          seq: undefined,
          returnDate: new DateOnly(),
          combinationId: this.lastFilter!.combinationId,
          goodId: resultItem.id,
          goodName: resultItem.name,
          specification: resultItem.specification,
          lotId: undefined,
          lotName: undefined,
          unitId: resultItem.unitId,
          unitName: resultItem.unitName,
          quantity: undefined,
          warehouseId: undefined,
          warehouseName: undefined,
          createdAtDateTime: undefined,
          createdByEmployeeId: undefined,
          createdByEmployeeName: undefined
        });
      }
    }

    this._cdr.markForCheck();
  }

  public onRemoveItemButtonClick(item: ICombinationInputReturnModalVM): void {
    this.items.remove(item);
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;
    this.lastFilter = Object.clone(this.filter);
    await this._search();
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
  }

  public async onSaveButtonClick(): Promise<void> {
    await this._save();
    this._cdr.markForCheck();
  }

  public async goodBuildGoodSearchModalOpenButtonClick(item: ICombinationInputReturnModalVM): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "반납 자재 검색", {isMulti: false});
    if (!result) return;

    if (this.items.filter(item1 => item1.goodId === result.id).length < 1) {
      item.goodId = result.id;
      item.goodName = result.name;
      item.specification = result.specification;
      item.unitId = result.unitId;
      item.unitName = result.unitName;
    }

    this._cdr.markForCheck();
  }

  private async _save(): Promise<void> {
    const diffs = this.orgItems.diffs(this.items, {keyProps: ["id"]}).reverse();
    const diffTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);

    if (this.items.length > 0 && diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    for (const diffTargetItem of diffTargets) {
      if (!diffTargetItem.quantity) {
        this._toast.danger("수량은 반드시 입력해야 합니다.");
        return;
      }

      if (!diffTargetItem.warehouseId) {
        this._toast.danger("창고는 반드시 선택해야 합니다.");
        return;
      }
    }

    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diff of diffs) {
          if (!diff.target!.id) {
            const lotInfo = await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, diff.target!.warehouseId!,
              diff.target!.goodId!, diff.target!.goodName!, "G0");

            const newInputReturn = await db.inputGeneralReturn
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                returnDate: diff.target!.returnDate!,
                mixingProcessId: this.lastFilter!.combinationId!,
                goodsId: diff.target!.goodId!,
                returnLotId: lotInfo.lotId,
                quantity: diff.target!.quantity,
                warehouseId: diff.target!.warehouseId!,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime()
              });
            diff.target!.id = newInputReturn.id;
            diff.target!.createdByEmployeeName = this._appData.authInfo!.employeeName;
            diff.target!.createdAtDateTime = new DateTime();

            await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.quantity, lotInfo.lotId, diff.target!.warehouseId, "+", "공통");
            await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.quantity, "+");
          }
          else {
            await db.inputGeneralReturn
              .where(item => [
                sorm.equal(item.id, diff.target!.id)
              ])
              .updateAsync(
                () => ({
                  returnDate: diff.target!.returnDate,
                  quantity: diff.target!.quantity
                })
              );

            await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.source!.quantity,  diff.target!.lotId, diff.target!.warehouseId, "-", "공통");
            await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.quantity,  diff.target!.lotId, diff.target!.warehouseId, "+", "공통");
            await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.source!.quantity, "-");
            await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.quantity, "+");
          }
        }
      });

      this.orgItems = Object.clone(this.items);

      this._toast.success("저장되었습니다.");
      this.close(true);
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        this.items = await queryable
          .include(item => item.lot)
          .include(item => item.goods)
          .include(item => item.warehouse)
          .include(item => item.employee)
          .select(item => ({
            id: item.id,
            seq: sorm.query("ROW_NUMBER() OVER (ORDER BY [lot].createdAtDateTime ASC)", Number),
            returnDate: item.returnDate,
            combinationId: item.mixingProcessId,
            goodId: item.goodsId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            lotId: item.returnLotId,
            lotName: item.lot!.lot,
            unitId: item.goods!.unitId,
            unitName: item.goods!.unitName,
            quantity: item.quantity,
            warehouseId: item.warehouseId,
            warehouseName: item.warehouse!.name,
            createdAtDateTime: item.createdAtDateTime,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name
          }))
          .orderBy(item => item.seq)
          .limit(this.pagination.page * 20, 20)
          .resultAsync();

        this.orgItems = Object.clone(this.items);

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 20);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    finally {
      this.busyCount--;
      this._cdr.markForCheck();

    }
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<InputGeneralReturn> {
    return db.inputGeneralReturn
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.mixingProcessId, this.lastFilter!.combinationId)
      ]);
  }
}

interface ICombinationInputReturnModalVM {
  id: number | undefined;
  returnDate: DateOnly | undefined;
  seq: number | undefined;
  combinationId: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  unitId: number | undefined;
  unitName: string | undefined;
  quantity: number | undefined;
  warehouseId: number | undefined;
  warehouseName: string | undefined;
  createdAtDateTime: DateTime | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
}
