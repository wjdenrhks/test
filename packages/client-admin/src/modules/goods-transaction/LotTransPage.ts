import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {DateTime} from "@simplism/core";
import {
  SdDomValidatorProvider,
  SdModalProvider,
  SdOrmProvider,
  SdToastProvider
} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {CodeProc, LotTransfer, MainDbContext} from "@sample/main-database";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {LotSearchModal} from "../../modals/LotSearchModal";
import {BarcodeRegisterModal} from "../../modals/BarcodeRegisterModal";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-lot-trans",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>라벨 변경</h4>

          <sd-topbar-menu (click)="onAddItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            행 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>
          <!--  <sd-topbar-menu (click)="onBarcodePrintButtonClick()" style="float: right; margin-right: 100px;">
              <sd-icon [icon]="'barcode'" [fixedWidth]="true"></sd-icon>
              바코드 출력(생성)
            </sd-topbar-menu>-->
          <!-- 
            <sd-topbar-menu *ngIf="lastFilter && (items && orgItems.length > 0)" (click)="onDownloadButtonClick()">
              <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
              다운로드
            </sd-topbar-menu>-->
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'기존 LOT'">
                <sd-textfield [(value)]="filter.fromLot"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'신규 LOT'">
                <sd-textfield [(value)]="filter.toLot"></sd-textfield>
              </sd-form-item>
              <!--  <sd-form-item [label]="'취소'">
                  <sd-checkbox [(value)]="filter.isCanceled"></sd-checkbox>
                </sd-form-item>-->
              <sd-form-item>
                <sd-button [type]="'submit'" [theme]="'primary'">
                  <sd-icon [icon]="'search'" [fixedWidth]="true"></sd-icon>
                  조회
                </sd-button>
              </sd-form-item>
            </sd-form>
          </sd-dock>

          <sd-dock class="sd-padding-sm-default">
            <sd-pagination [page]="pagination.page" [length]="pagination.length"
                           (pageChange)="onPageClick($event)"></sd-pagination>
          </sd-dock>

          <sd-busy-container [busy]="mainBusyCount > 0">
            <sd-dock-container>
              <sd-sheet #sheet [id]="'lot-trans'"
                        [items]="items"
                        [trackBy]="trackByIdFn">
                <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span *ngIf="item.id">{{ item.id }}</span>
                      <a *ngIf="!item.id" (click)="onRemoveItemButtonClick(item)">
                        <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'기존 LOT'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.fromLot }}
                      <a (click)="fromLotSearchModalOpenButtonClick(item)"
                         [attr.sd-invalid]="!item.fromLotId">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'신규 LOT'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.toLot" [required]="true" [disabled]="!!item.id"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <!-- <sd-sheet-column [header]="'신규 LOT'">
                   <ng-template #item let-item="item">
                     <div class="sd-padding-xs-sm">
                       {{ item.toLot }}
                       <a (click)="toLotSearchModalOpenButtonClick(item)"
                          [attr.sd-invalid]="!item.toLotId">
                         <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                       </a>
                     </div>
                   </ng-template>
                 </sd-sheet-column>-->
                <sd-sheet-column [header]="'사유'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.remark"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록자'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdByEmployeeName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록시간'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdAtDateTime?.toFormatString("yyyy-MM-dd HH:mm") }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'취소'" [width]="60">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isCanceled" [disabled]="!item.id"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>
            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class LotTransPage implements OnInit {

  public filter: IFilterVM = {
    fromLot: undefined,
    toLot: undefined,
    isCanceled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: ILotTransVM[] = [];
  public orgItems: ILotTransVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;


  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _cdr: ChangeDetectorRef) {

  }


  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;

    await this.onSearchFormSubmit();
    this.mainBusyCount--;

    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "LOT 전환 메뉴얼", {type: "lot-trans"});
    if (!result) return;

    this._cdr.markForCheck();
  }


  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      fromLotId: undefined,
      fromLot: undefined,
      fromGoodId: undefined,
      fromGoodRating: undefined,
      fromWarehouseId: undefined,
      toLotId: undefined,
      toLot: undefined,
      toGoodId: undefined,
      toGoodRating: undefined,
      goodId: undefined,
      remark: undefined,
      createdAtDateTime: undefined,
      createdByEmployeeName: undefined,
      createdByEmployeeId: undefined,
      isCanceled: false
    });
  }

  public onRemoveItemButtonClick(item: ILotTransVM): void {
    this.items.remove(item);
  }

  public async fromLotSearchModalOpenButtonClick(item: ILotTransVM): Promise<void> {
    const result = await this._modal.show(LotSearchModal, "LOT 검색", {isMulti: false});
    if (!result) return;

    item.fromLotId = result.id;
    item.fromLot = result.lot;
    item.fromWarehouseId = result.warehouseId;
    item.goodId = result.goodId;

    this._cdr.markForCheck();
  }

  public async onBarcodePrintButtonClick(): Promise<void> {
    const result = await this._modal.show(BarcodeRegisterModal, "바코드 출력", {type: "입고"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;
    this.lastFilter = Object.clone(this.filter);
    await this._search();
    this._cdr.markForCheck();
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
    this._cdr.markForCheck();
  }

  @HostListener("document:keydown", ["$event"])
  public async onDocumentKeydown(event: KeyboardEvent): Promise<void> {
    if ((event.key === "s" || event.key === "S") && event.ctrlKey) {
      event.preventDefault();
      await this._save();
      this._cdr.markForCheck();
    }
  }

  public async onSaveButtonClick(): Promise<void> {
    await this._save();
    this._cdr.markForCheck();
  }

  private async _save(): Promise<void> {
    const diffTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);

    if (diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    if (diffTargets.some(item => item.toLot === item.fromLot)) {
      this._toast.danger("기존 LOT와 신규LOT가 동일 할 수 없습니다.");
      return;
    }

    for (const diffItem of diffTargets) {
      if (!diffItem.isCanceled) {
        const isLotInfo = await this._getSearchLotInfo(diffItem);

        if (isLotInfo && isLotInfo.length > 0) {
          this._toast.danger("동일한 LOT가 등록되어 있습니다: " + diffItem.toLot!);
          return;
        }
      }
    }

    this.viewBusyCount++;

    try {

      this._domValidator.validate(this._elRef!.nativeElement);

      Object.validatesArray(
        diffTargets,
        `LOT 전환`,
        {
          id: {displayName: "ID", type: Number},
          fromLotId: {displayName: "기존 LOT", notnull: true},
          toLot: {displayName: "신규 LOT", notnull: true},
          isCanceled: {displayName: "취소", type: Boolean, notnull: true}
        }
      );

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diffItem of diffTargets) {
          diffItem.toLot = diffItem.toLot!.trim();
          const toLotInfo = await CodeProc.printLot(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, diffItem.fromWarehouseId!, diffItem.goodId!, diffItem.toLot, diffItem.fromLotId!);

          // INSERT
          if (!diffItem.id) {
            const newStockTransfer = await db.lotTransfer
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                fromLotId: diffItem.fromLotId!,
                toLotId: toLotInfo!.lotId!,
                goodId: diffItem.goodId!,
                remark: diffItem.remark,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime(),
                isCanceled: false
              });
            diffItem.id = newStockTransfer.id;
            diffItem.createdByEmployeeName = this._appData.authInfo!.employeeName;
            diffItem.createdAtDateTime = new DateTime();

            await db.lotHistory
              .where(item => [
                sorm.equal(item.id, diffItem.fromLotId)
              ])
              .updateAsync(
                () => ({
                  lot: diffItem.toLot!,
                  transLot: diffItem.fromLot!,
                  transLotId: diffItem.toLotId
                })
              );

            await db.lotHistory
              .where(item => [
                sorm.equal(item.id, diffItem.toLotId)
              ])
              .updateAsync(
                () => ({
                  transLotId: diffItem.fromLotId
                })
              );
          }
          // UPDATE
          else {
            if (diffItem.isCanceled) {
              await db.lotHistory
                .where(item => [
                  sorm.equal(item.id, diffItem.fromLotId)
                ])
                .updateAsync(
                  () => ({
                    lot: diffItem.fromLot,
                    transLot: undefined
                  })
                );

              await db.lotHistory
                .where(item => [
                  sorm.equal(item.id, diffItem.toLotId)
                ])
                .updateAsync(
                  () => ({
                    transLotId: undefined
                  })
                );
              await db.lotTransfer.where(item => [sorm.equal(item.id, diffItem.id)]).deleteAsync();
            }
            else {
              await db.lotTransfer
                .where(item => [
                  sorm.equal(item.id, diffItem.id)
                ])
                .updateAsync(
                  () => ({
                    remark: diffItem.remark!
                  })
                );
            }
          }
        }
      });

      this.orgItems = Object.clone(this.items);
      this._toast.success("저장되었습니다.");
      await this._search();
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  private async _getSearchLotInfo(diffItem: any): Promise<any | undefined> {
    return await this._orm.connectAsync(MainDbContext, async db => {
      return await db.lotHistory.where(item => [sorm.equal(item.lot, diffItem.toLot)]).resultAsync();
    });
  }

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        this.items = await queryable
          .include(item => item.employee)
          .include(item => item.fromLot)
          .include(item => item.toLot)
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .select(item => ({
            id: item.id,
            fromLotId: item.fromLotId,
            fromLot: item.fromLot!.transLot,
            fromGoodId: item.fromLot!.goodId,
            fromGoodRating: item.fromLot!.goodsRating,
            fromWarehouseId: item.fromLot!.warehouseId,
            toLotId: item.toLotId,
            toLot: item.toLot!.lot,
            toGoodId: item.toLot!.goodId,
            toGoodRating: item.toLot!.goodsRating,
            goodId: item.goodId,
            remark: item.remark,
            createdAtDateTime: item.createdAtDateTime,
            createdByEmployeeName: item.employee!.name,
            createdByEmployeeId: item.createdByEmployeeId,
            isCanceled: item.isCanceled
          }))
          .wrap()
          .resultAsync();
        this.orgItems = Object.clone(this.items);

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 50);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<LotTransfer> {
    let queryable = db.lotTransfer
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.fromLot) {
      queryable = queryable
        .include(item => item.fromLot)
        .where(item => [
          sorm.includes(item.fromLot!.lot, this.lastFilter!.fromLot)
        ]);
    }

    if (this.lastFilter!.toLot) {
      queryable = queryable
        .include(item => item.toLot)
        .where(item => [
          sorm.includes(item.toLot!.lot, this.lastFilter!.toLot)
        ]);
    }

    queryable = queryable.where(item => [
      sorm.equal(item.isCanceled, this.lastFilter!.isCanceled)
    ]);

    return queryable.wrap(LotTransfer);
  }

}

interface IFilterVM {
  fromLot?: string;
  toLot?: string;
  isCanceled: boolean;
}

interface ILotTransVM {
  id: number | undefined;
  fromLotId: number | undefined;
  fromLot: string | undefined;
  fromGoodId: number | undefined;
  fromGoodRating: "A" | "B" | "C" | "공통" | undefined;
  fromWarehouseId: number | undefined;
  toLotId: number | undefined;
  toLot: string | undefined;
  toGoodId: number | undefined;
  toGoodRating: "A" | "B" | "C" | "공통" | undefined;
  goodId: number | undefined;
  remark: string | undefined;
  createdAtDateTime: DateTime | undefined;
  createdByEmployeeName: string | undefined;
  createdByEmployeeId: number | undefined;
  isCanceled: boolean;
}