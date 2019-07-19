import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit} from "@angular/core";
import {DateTime} from "@simplism/core";
import {SdModalProvider, SdOrmProvider, SdPrintProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {StockSearchModal} from "../../modals/StockSearchModal";
import {CodeProc, MainDbContext, Packing} from "@sample/main-database";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {PackingBarcodePrintTemplate} from "../../print-templates/PackingBarcodePrintTemplate";
import {SmallBarcodePrintTemplate} from "../../print-templates/SmallBarcodePrintTemplate";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-packing",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>포장 관리</h4>

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

          <!--  
            <sd-topbar-menu *ngIf="lastFilter && (items && orgItems.length > 0)" (click)="onDownloadButtonClick()">
              <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
              다운로드
            </sd-topbar-menu>-->
        </sd-topbar>
        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'LOT 번호'">
                <sd-textfield [(value)]="filter.lot"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'팔레트 바코드'">
                <sd-textfield [(value)]="filter.paletteBarcode"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'사용중지 제외'">
                <sd-checkbox [(value)]="filter.isDisabled"></sd-checkbox>
              </sd-form-item>
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
              <sd-sheet #sheet [id]="'packing'"
                        [items]="items"
                        [trackBy]="trackByIdFn"
                        [(selectedItem)]="selectedItem"
                        [selectable]="true">
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
                <sd-sheet-column [header]="'팔레트 바코드'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.paletteBarcode" [disabled]="true"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록자'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdByEmployeeName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록일'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdAtDateTime?.toFormatString("yyyy-MM-dd HH:mm") }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'출력'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-sm-sm" style="text-align: center;" *ngIf="!!item.id">
                      <sd-icon [icon]="'print'" [fixedWidth]="true" (click)="onPackingBarcodePrint(item)"></sd-icon>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'사용중지'" [width]="70">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isDisabled" [disabled]="!item.id"
                                   (valueChange)="onDisabledChange(item)"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

              <sd-dock [position]="'bottom'" style="height: 40%" *ngIf="selectedItem"
                       [id]="'packing-list'">
                <sd-busy-container [busy]="selectedItemBusyCount > 0">
                  <sd-dock-container class="sd-background-default">
                    <sd-dock class="sd-padding-xs-sm">
                      <h5 style="display: inline-block; padding-right: 1.4em;">LOT 리스트</h5>
                      <sd-button [size]="'sm'" (click)="onAddPackingListItemButtonClick()" [inline]="true">
                        <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                        행 추가
                      </sd-button>
                      &nbsp;
                      <sd-button [size]="'sm'" (click)="onRegisterNewPackingListButtonClick()" [inline]="true"
                                 [disabled]="newItems.length < 1">
                        <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                        신규 팔레트
                      </sd-button>
                      <sd-button (click)="onBarcodePrintButtonClick()" style="float: right; margin-right: 80px;"
                                 [disabled]="!selectedItem.packingLotList || selectedItem.packingLotList.length < 1">
                        <sd-icon [icon]="'barcode'" [fixedWidth]="true"></sd-icon>
                        바코드 출력
                      </sd-button>
                    </sd-dock>

                    <sd-pane>
                      <sd-sheet [id]="'packing-list'"
                                [items]="selectedItem.packingLotList"
                                [trackBy]="trackByIdFn"
                                [selectable]="'multi'"
                                [selectedItems]="newItems"
                                (selectedItemsChange)="onSelectedItemsChange($event)">
                        <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <span *ngIf="item.id">{{ item.seq }}</span>
                              <a *ngIf="!item.id" (click)="onRemovePackingListItemButtonClick(item)">
                                <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'LOT'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm">
                              {{ item.lotName }}
                              <a (click)="packingListItemSearchModalOpenButtonClick(item)">
                                <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'제품명'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm">
                              {{ item.goodName }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'규격'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm">
                              {{ item.specification }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'단위'" [width]="80">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.unitName }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'사용중지'" [width]="70">
                          <ng-template #item let-item="item">
                            <div style="text-align: center;">
                              <sd-checkbox [(value)]="item.isDisabled"
                                           [disabled]="!item.id"></sd-checkbox>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                      </sd-sheet>
                    </sd-pane>
                  </sd-dock-container>
                </sd-busy-container>
              </sd-dock>


            </sd-dock-container>
          </sd-busy-container>

        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class PackingPage implements OnInit {

  public filter: IFilterVM = {
    lot: undefined,
    paletteBarcode: undefined,
    isDisabled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IPackingVM[] = [];
  public orgItems: IPackingVM[] = [];
  public newItems: IPackingLotListVM[] = [];

  public selectedItem?: IPackingVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _print: SdPrintProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;

    await this.onSearchFormSubmit();
    this.mainBusyCount--;

    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "포장관리 메뉴얼", {type: "packing"});
    if (!result) return;

    this._cdr.markForCheck();
  }


  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      paletteBarcode: undefined,
      isPrinting: false,
      createdAtDateTime: undefined,
      createdByEmployeeId: undefined,
      createdByEmployeeName: undefined,
      isDisabled: false,

      packingLotList: undefined
    });
  }

  public onRemoveItemButtonClick(item: IPackingVM): void {
    this.items.remove(item);

    if (this.selectedItem === item) {
      this.selectedItem = undefined;
    }
  }


  public async onPackingBarcodePrint(item: IPackingVM): Promise<void> {

    if (!item.packingLotList || item.packingLotList.length < 1) {
      this._toast.danger("LOT리스트가 구성되지 않았습니다.");
      return;
    }

    const goodName = item.packingLotList![0].goodName;
    const specification = item.packingLotList![0].width;
    const thick = item.packingLotList![0].thick;
    const length = item.packingLotList![0].length;
    const palletBarcode = item.paletteBarcode;
    const location = item.packingLotList![0].warehouseName;

    const lotList = item.packingLotList.map(item1 => ({
      lotId: item1.lotId,
      lotName: item1.lotName,
      weight: item1.weight,
      length: item1.length
    })).orderBy(item1 => item1.lotName);

    const result: any = {
      goodName,
      specification,
      thick,
      length,
      palletBarcode,
      location,
      lotList
    };

    await this._print.print(PackingBarcodePrintTemplate, {printItems: result});
    this._cdr.markForCheck();
  }

  public async onBarcodePrintButtonClick(): Promise<void> {
    if (!this.selectedItem!.packingLotList || this.selectedItem!.packingLotList!.length < 1) {
      this._toast.danger("출력할 바코드를 추가해 주세요.");
      return;
    }

    const printList: any[] = [];
    for (const printItem of this.selectedItem!.packingLotList!) {
      printList.push({
        goodName: printItem.goodName,
        specification: printItem.width,
        thick: printItem.thick,
        length: printItem.length,
        lot: printItem.lotName
      });
    }

    await this._print.print(SmallBarcodePrintTemplate, {printList});
    this._cdr.markForCheck();
  }

  public async onAddPackingListItemButtonClick(): Promise<void> {
    this.selectedItem!.packingLotList = this.selectedItem!.packingLotList || [];

    const result = await this._modal.show(StockSearchModal, "재고 제품(LOT) 검색", {
      isMulti: true,
      isPackingSearch: true
    });
    if (!result) return;

    for (const stockLot of result || []) {
      if (this.selectedItem!.packingLotList!.filter(item => item.lotName === stockLot.lotName).length < 1) {
        this.selectedItem!.packingLotList!.insert(0, {
          id: undefined,
          seq: undefined,
          stockId: stockLot.id,
          productionItemId: stockLot.productionItemId,
          warehouseId: stockLot.warehouseId,
          warehouseName: stockLot.warehouseName,
          goodId: stockLot.goodId,
          goodName: stockLot.goodName,
          specification: stockLot.specification,
          thick: stockLot.thick,
          weight: stockLot.weight,
          width: stockLot.width,
          length: stockLot.length,
          unitName: stockLot.unitName,
          lotId: stockLot.lotId,
          lotName: stockLot.lotName,
          isDisabled: false
        });
      }

      this._cdr.markForCheck();
    }
  }

  public onRemovePackingListItemButtonClick(item: IPackingLotListVM): void {
    this.selectedItem!.packingLotList!.remove(item);
  }

  public async packingListItemSearchModalOpenButtonClick(item: IPackingLotListVM): Promise<void> {
    const result = await this._modal.show(StockSearchModal, "재고 제품(LOT) 검색", {
      isMulti: false,
      isPackingSearch: true
    });
    if (!result) return;

    if (this.selectedItem!.packingLotList && this.selectedItem!.packingLotList!.filter(item1 =>
      item1.lotName === result.lotName).length < 1) {
      item.stockId = result.id;
      item.productionItemId = result.productionItemId;
      item.warehouseId = result.warehouseId;
      item.warehouseName = result.warehouseName;
      item.goodId = result.goodId;
      item.goodName = result.goodName;
      item.specification = result.specification;
      item.thick = result.thick;
      item.weight = result.weight;
      item.width = result.width;
      item.length = result.length;
      item.unitName = result.unitName;
      item.lotId = result.lotId;
      item.lotName = result.lotName;
    }
    this._cdr.markForCheck();
  }

  public async onDisabledChange(item: IPackingVM): Promise<void> {

    if (item.isDisabled) {
      for (const packingItem of item.packingLotList || []) {
        packingItem.isDisabled = true;
      }
    }
    else {
      for (const packingItem of item.packingLotList || []) {
        packingItem.isDisabled = !packingItem.isDisabled;
      }
    }

    this._cdr.markForCheck();
  }

  public onSelectedItemsChange(items: any[]): void {
    this.newItems = items.filter(item => !!item.id);
  }

  public async onRegisterNewPackingListButtonClick(): Promise<void> {
    if (this.newItems.length < 1) {
      this._toast.danger("신규 팔레트를 구성할 항목을 선택해 주세요.");
      return;
    }
    const itemList = Object(this.newItems);

    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        for (const delItem of itemList) {
          await db.productionItem
            .where(item => [
              sorm.equal(item.id, delItem.productionItemId)
            ])
            .updateAsync(
              () => ({
                packingId: undefined
              })
            );

          await db.packingItem.where(item => [sorm.equal(item.id, delItem.id)]).deleteAsync();

          await db.stock
            .include(item => item.lot)
            .where(item => [
              sorm.equal(item.lot!.isTesting, false),
              sorm.equal(item.lotId, delItem.lotId)
            ])
            .updateAsync(
              () => ({
                paletteBarcodeId: undefined
              })
            );
        }

        const documentCode = await CodeProc.getDocumentCode(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, undefined, undefined, "포장", undefined, undefined);

        const newPacking = await db.packing
          .insertAsync({
            companyId: this._appData.authInfo!.companyId,
            paletteBarcode: documentCode,
            codeSeq: Number(documentCode.substr(-5, 5)),
            isPrinting: false,
            createdByEmployeeId: this._appData.authInfo!.employeeId,
            createdAtDateTime: new DateTime(),
            isDisabled: false
          });

        let seq = 1;
        for (const packingItem of this.newItems || []) {
          const newPackingItem = await db.packingItem
            .insertAsync({
              companyId: this._appData.authInfo!.companyId,
              packingId: newPacking.id!,
              stockId: packingItem.stockId,
              seq,
              lotId: packingItem.lotId!,
              goodId: packingItem.goodId!,
              isDisabled: false,
              createdAtDateTime: new DateTime(),
              createdByEmployeeId: this._appData.authInfo!.employeeId
            });
          packingItem.id = newPackingItem.id;
          seq++;

          if (packingItem.productionItemId) {
            await db.productionItem
              .where(item => [
                sorm.equal(item.id, packingItem.productionItemId)
              ])
              .updateAsync(
                () => ({
                  packingId: newPackingItem.id
                })
              );
          }

          await db.stock
            .include(item => item.lot)
            .where(item => [
              sorm.equal(item.id, packingItem.stockId),
              sorm.equal(item.lot!.isNotStock, false)
            ])
            .updateAsync(
              () => ({
                paletteBarcodeId: newPacking.id
              })
            );
        }
      });

      this._toast.success("신규 팔레트 발급이 완료 되었습니다");
      await this.onSearchFormSubmit();
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

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

    if (diffTargets.some(item => !item.id && !item.packingLotList)) {
      this._toast.danger("LOT리스트가 비어 있습니다.");
      return;
    }

    this.viewBusyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diffItem of diffTargets) {
          // INSERT
          if (!diffItem.id) {
            const documentCode = await CodeProc.getDocumentCode(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, undefined, undefined, "포장", undefined, undefined);

            const newPacking = await db.packing
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                paletteBarcode: documentCode,
                codeSeq: Number(documentCode.substr(-5, 5)),
                isPrinting: false,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime(),
                isDisabled: false
              });
            diffItem.id = newPacking.id;
            diffItem.createdByEmployeeName = this._appData.authInfo!.employeeName;
            diffItem.createdAtDateTime = new DateTime();

            let seq = 1;
            for (const packingItem of diffItem.packingLotList || []) {
              const newPackingItem = await db.packingItem
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  packingId: newPacking.id!,
                  stockId: packingItem.stockId,
                  seq,
                  lotId: packingItem.lotId!,
                  goodId: packingItem.goodId!,
                  isDisabled: false,
                  createdAtDateTime: new DateTime(),
                  createdByEmployeeId: this._appData.authInfo!.employeeId
                });
              packingItem.id = newPackingItem.id;
              seq++;

              if (packingItem.productionItemId) {
                await db.productionItem
                  .where(item => [
                    sorm.equal(item.id, packingItem.productionItemId)
                  ])
                  .updateAsync(
                    () => ({
                      packingId: newPackingItem.id
                    })
                  );
              }

              await db.stock
                .include(item => item.lot)
                .where(item => [
                  sorm.equal(item.id, packingItem.stockId),
                  sorm.equal(item.lot!.isNotStock, false)
                ])
                .updateAsync(
                  () => ({
                    paletteBarcodeId: diffItem.id
                  })
                );
            }
          }
          // UPDATE
          else {
            await db.packing
              .where(item => [
                sorm.equal(item.id, diffItem.id)
              ])
              .updateAsync(
                () => ({
                  isDisabled: diffItem.isDisabled,
                  isPrinting: diffItem.isPrinting
                })
              );

            for (const packingItem of diffItem.packingLotList || []) {
              if (!packingItem.id) {
                const newPackingItem = await db.packingItem
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    stockId: packingItem.stockId,
                    packingId: diffItem.id!,
                    lotId: packingItem.lotId!,
                    goodId: packingItem.goodId!,
                    isDisabled: false,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId
                  });
                packingItem.id = newPackingItem.id;

                if (packingItem.productionItemId) {
                  await db.productionItem
                    .where(item => [
                      sorm.equal(item.id, packingItem.productionItemId)
                    ])
                    .updateAsync(
                      () => ({
                        packingId: newPackingItem.id
                      })
                    );
                }

                await db.stock
                  .include(item => item.lot)
                  .where(item => [
                    sorm.equal(item.id, packingItem.stockId),
                    sorm.equal(item.lot!.isNotStock, false)
                  ])
                  .updateAsync(
                    () => ({
                      paletteBarcodeId: diffItem.id
                    })
                  );
              }
              else {
                if (packingItem.isDisabled) {
                  await db.productionItem.where(item => [
                    sorm.equal(item.packingId, packingItem.id)
                  ])
                    .updateAsync(() => ({
                        packingId: undefined
                      })
                    );

                  await db.packingItem.where(item => [sorm.equal(item.id, packingItem.id)]).deleteAsync();
                  await db.stock
                    .include(item => item.lot)
                    .where(item => [
                      sorm.equal(item.id, packingItem.stockId),
                      sorm.equal(item.lot!.isNotStock, false)
                    ])
                    .updateAsync(
                      () => ({
                        paletteBarcodeId: undefined
                      })
                    );
                }
              }
            }

            if (diffItem.packingLotList && diffItem.packingLotList!.length > 0 && diffItem.packingLotList!.some(item => item.isDisabled)) {
              diffItem.packingLotList!.remove(item => item.isDisabled);
            }

            const packingItems = await db.packingItem.where(item => [sorm.equal(item.packingId, diffItem.id)]).resultAsync();

            let seq = 1;
            for (const updatePackingItem of packingItems || []) {
              await db.packingItem
                .where(item => [sorm.equal(item.id, updatePackingItem.id)])
                .updateAsync(
                  () => ({
                    seq
                  })
                );
              seq++;
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

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        this.items = await queryable
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .wrap(Packing)
          .include(item => item.packingItems)
          .include(item => item.packingItems![0].goods)
          .include(item => item.packingItems![0].lot)
          .include(item => item.packingItems![0].employee)
          .include(item => item.packingItems![0].stock)
          .include(item => item.packingItems![0].stock!.warehouse)
          .include(item => item.employee)
          .select(item => ({
            id: item.id,
            paletteBarcode: item.paletteBarcode,
            isPrinting: item.isPrinting,
            createdAtDateTime: item.createdAtDateTime,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            isDisabled: item.isDisabled,

            packingLotList: item.packingItems && item.packingItems.map(item1 => ({
              id: item1.id,
              seq: item1.seq,
              stockId: item1.stockId,
              productionItemId: item1.lot!.productionItemId,
              warehouseId: item1.stock!.warehouseId,
              warehouseName: item1.stock!.warehouse!.name,
              goodId: item1.goodId,
              goodName: item1.goods!.name,
              specification: item1.goods!.specification,
              thick: sorm.ifNull(item1.lot!.thick, item1.goods!.thick),
              width: sorm.ifNull(item1.lot!.width, item1.goods!.specification),
              weight: sorm.ifNull(item1.lot!.weight, item1.goods!.weight),
              length: item1.lot!.length,
              unitName: item1.goods!.unitName,
              lotId: item1.lotId,
              lotName: item1.lot!.lot,
              isDisabled: item1.isDisabled
            })) || undefined
          }))
          .resultAsync();

        this.orgItems = Object.clone(this.items);
        this.selectedItem = undefined;

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

  private _getSearchQueryable(db: MainDbContext): Queryable<Packing> {
    let queryable = db.packing
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.paletteBarcode) {
      queryable = queryable
        .where(item => [
          sorm.includes(item.paletteBarcode, this.lastFilter!.paletteBarcode)
        ]);
    }

    if (this.lastFilter!.lot) {
      queryable = queryable
        .include(item => item.packingItems)
        .include(item => item.packingItems![0].lot)
        .where(item => [
          sorm.includes(item.packingItems![0].lot!.lot, this.lastFilter!.lot)
        ]);
    }

    if (!!this.lastFilter!.isDisabled) {
      queryable = queryable.where(item => [
        sorm.equal(item.isDisabled, false)
      ]);
    }

    return queryable;
  }

}

interface IFilterVM {
  lot?: string;
  paletteBarcode?: string;
  isDisabled: boolean;
}

interface IPackingVM {
  id: number | undefined;
  paletteBarcode: string | undefined;
  isPrinting: boolean | undefined;
  createdAtDateTime: DateTime | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  isDisabled: boolean;

  packingLotList: IPackingLotListVM[] | undefined;
}

interface IPackingLotListVM {
  id: number | undefined;
  seq: number | undefined;
  stockId: number | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  warehouseId: number | undefined;
  warehouseName: string | undefined;
  specification: string | undefined;
  productionItemId: number | undefined;
  weight: number | undefined;
  thick: number | undefined;
  width: string | undefined;
  length: number | undefined;
  unitName: string | undefined;
  isDisabled: boolean;
}