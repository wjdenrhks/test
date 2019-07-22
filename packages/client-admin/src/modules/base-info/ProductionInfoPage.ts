import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {GoodsSearchModal} from "../../modals/GoodsSearchModal";
import {SdDomValidatorProvider, SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {MainDbContext, ProductionInfo} from "@sample/main-database";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {DateTime} from "@simplism/core";
import {ProductionInfoEquipmentModal} from "../../modals/ProductionInfoEquipmentModal";

@Component({
  selector: "app-production-info",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>생산 정보</h4>
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
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'제품명'">
                <sd-textfield [(value)]="filter.goodName"></sd-textfield>
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
              <sd-sheet #sheet [id]="'production-info'"
                        [items]="items"
                        [trackBy]="trackByIdFn"
                        [(selectedItem)]="selectedItem"
                        (selectedItemChange)="onSelectedItemChanged($event)"
                        [selectable]="'manual'">
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
                <sd-sheet-column [header]="'구분'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.goodType }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'분류'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.goodCategory }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'제품명'">
                  <ng-template #item let-item="item">
                    <app-good-select *ngIf="!item.id" [isReceipt]="true"
                                     [(value)]="item.goodId" (valueChange)="onChangeGood($event, item)"
                                     [required]="true">
                    </app-good-select>
                    <div class="sd-padding-xs-sm" *ngIf="!!item.id">
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
                <sd-sheet-column [header]="'설비'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="overflow: hidden;">
                      <div style="display: inline-block;">
                        <a (click)="productionInfoEquipmentModalOpenButtonClick(item)">
                          {{ item.equipmentIds }}
                        </a>
                        <a (click)="productionInfoEquipmentModalOpenButtonClick(item)">
                          <sd-icon [fixedWidth]="true" [icon]="'search'"
                                   *ngIf="!!item.id && !item.equipmentIds"></sd-icon>
                        </a>
                      </div>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'사용중지'" [width]="60">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isDisabled"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

              <sd-dock [position]="'right'" *ngIf="selectedItem" [id]="'production-info-item'"
                       style="width: 35%">
                <sd-dock-container class="sd-background-default">
                  <sd-pane>
                    <sd-dock-container>
                      <sd-dock class="sd-padding-xs-sm">
                        <h5 style="display: inline-block; padding-right: 1.4em;">산출 품목</h5>
                        <sd-button [size]="'sm'" (click)="onAddProductionGoodButtonClick(true)" [inline]="true">
                          <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                          행 추가
                        </sd-button>
                        <!--&nbsp;
                        <sd-button [size]="'sm'" (click)="onCopyGoodProductionButtonClick()" [inline]="true">
                          <sd-icon [icon]="'copy'" [fixedWidth]="true"></sd-icon>
                          산출 품목 복사
                        </sd-button>-->
                      </sd-dock>
                      

                      <sd-dock>
                        <sd-pane>
                          <sd-sheet [id]="'production-goods'"
                                    [items]="selectedItem.productionGoods"
                                    [trackBy]="trackByMeFn">
                            <sd-sheet-column [header]="'구분'" [width]="80">
                              <ng-template #item let-item="item">
                                <sd-select [(value)]="item.type">
                                  <sd-select-item [value]="'재생'">재생</sd-select-item>
                                  <sd-select-item [value]="'판매'">판매</sd-select-item>
                                </sd-select>
                              </ng-template>
                            </sd-sheet-column>
                            <!--<sd-sheet-column [header]="'제품구분'">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.goodType }}
                                </div>
                              </ng-template>
                            </sd-sheet-column>-->
                            <!--<sd-sheet-column [header]="'분류'">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.goodCategory }}
                                </div>
                              </ng-template>
                            </sd-sheet-column>-->
                            <sd-sheet-column [header]="'제품명'">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.goodName }}
                                  <a (click)="productionGoodsSearchModalOpenButtonClick(item)">
                                    <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                                  </a>
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
                            <!--<sd-sheet-column [header]="'삭제'" [width]="60">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm" style="text-align: center;">
                                  <a *ngIf="!item.id" (click)="onRemoveItemProductionGoodButtonClick(item)">
                                    <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                  </a>
                                  <a *ngIf="!!item.id" (click)="onCompletelyRemoveItemProductionGoodButtonClick(item)">
                                    <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                  </a>
                                </div>
                              </ng-template>
                            </sd-sheet-column>-->
                          </sd-sheet>





                        </sd-pane>
                        
                      </sd-dock>


                      <sd-dock class="sd-padding-xs-sm">
                        <h5 style="display: inline-block; padding-right: 1.4em;">판매 품목</h5>
                        <sd-button [size]="'sm'" (click)="onAddProductionGoodButtonClick(false)" [inline]="true">
                          <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                          행 추가
                        </sd-button>
                        <!--&nbsp;
                        <sd-button [size]="'sm'" (click)="onCopyGoodProductionButtonClick()" [inline]="true">
                          <sd-icon [icon]="'copy'" [fixedWidth]="true"></sd-icon>
                          산출 품목 복사
                        </sd-button>-->
                      </sd-dock>
                      <sd-dock *ngIf="selectedItem" [id]="'sale-info-item'">
                        <sd-pane>
                          <sd-sheet [id]="'sale-goods'"
                                    [items]="selectedItem.saleGoods"
                                    [trackBy]="trackByMeFn">
                            <!--<sd-sheet-column [header]="'구분'" [width]="80">
                              <ng-template #item let-item="item">
                                <sd-select [(value)]="item.type">
                                  <sd-select-item [value]="'재생'">재생</sd-select-item>
                                  <sd-select-item [value]="'판매'">판매</sd-select-item>
                                </sd-select>
                              </ng-template>
                            </sd-sheet-column>-->
                            <!--<sd-sheet-column [header]="'제품구분'">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.goodType }}
                                </div>
                              </ng-template>
                            </sd-sheet-column>-->
                            <!--<sd-sheet-column [header]="'분류'">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.goodCategory }}
                                </div>
                              </ng-template>
                            </sd-sheet-column>-->
                            <sd-sheet-column [header]="'제품명'">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.goodName }}
                                  <a (click)="productionGoodsSearchModalOpenButtonClick(item)">
                                    <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                                  </a>
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
                            <!--<sd-sheet-column [header]="'삭제'" [width]="60">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm" style="text-align: center;">
                                  <a *ngIf="!item.id" (click)="onRemoveItemProductionGoodButtonClick(item)">
                                    <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                  </a>
                                  <a *ngIf="!!item.id" (click)="onCompletelyRemoveItemProductionGoodButtonClick(item)">
                                    <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                  </a>
                                </div>
                              </ng-template>
                            </sd-sheet-column>-->
                          </sd-sheet>
                        </sd-pane>
                      </sd-dock>
                    </sd-dock-container>
                  </sd-pane>
                </sd-dock-container>
              </sd-dock>
              
            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`

})
export class ProductionInfoPage implements OnInit {

  public filter: IFilterVM = {
    sort: "id",
    goodName: undefined,
    isDisabled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IProductionInfoVM[] = [];
  public orgItems: IProductionInfoVM[] = [];

  public selectedItem?: IProductionInfoVM;
  // public selectedChart?: IQualityListVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;
  public selectedItemBusyCount = 0;

  public inspectionTypeName?: string;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _modal: SdModalProvider,
                     private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    await this.onSearchFormSubmit();
    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      goodId: undefined,
      goodType: undefined,
      goodCategory: undefined,
      goodName: undefined,
      specification: undefined,
      unitName: undefined,
      isDisabled: false,
      isProductionGoods: false,

      saleGoods: undefined,
      productionGoods: undefined
    });
  }

  public async onSelectedItemChanged(item: IProductionInfoVM, isCheck?: boolean): Promise<void> {

    if (item && !item.goodId && !isCheck) {
      this._toast.danger("생산정보를 입력 할 품목을 먼저 선택해 주세요.");
      this.selectedItem = undefined;
      this._cdr.markForCheck();
      return;
    }
    else if (item && !item.goodId && isCheck) {
      this.selectedItem = undefined;
      this._cdr.markForCheck();
      return;
    }

    //await this._selectItem(item);
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

  public async productionInfoEquipmentModalOpenButtonClick(item: IProductionGoodsVM): Promise<void> {
    const result = await this._modal.show(ProductionInfoEquipmentModal, "제품별 설비", {
      goodId: item.goodId,
      productionInfoId: item.id
    });

    // const result = await this._modal.show(ProductionInfoEquipModal, "제품별 설비", {
    //   goodId: item.goodId,
    //   productionInfoId: item.id
    // });

    if (!result) return;

    await this._search();
    this._cdr.markForCheck();
  }

  private async _save(): Promise<void> {
    const diffTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);

    if (diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    for (const items of this.items || []) {
      for (const item of items.productionGoods || []) {
        if (items.productionGoods!.length > 0 && items.productionGoods!.filter(item1 => (item1.type === item.type && item1.goodId === item.goodId)).length > 1) {
          this._toast.danger("품목 : " + items.goodName + "의 산출품목에 동일한 구분을 가진 제품이 있습니다.\n확인 후 다시 진행해 주세요.");
          return;
        }
      }
    }

    this.viewBusyCount++;

    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      Object.validatesArray(
        diffTargets,
        `생산정보`,
        {
          id: {displayName: "ID", type: Number},
          goodName: {displayName: "제품명", notnull: true},
          isDisabled: {displayName: "사용중지", type: Boolean, notnull: true}
        }
      );

      await this._orm.connectAsync(MainDbContext, async db => {

        for (const diffItem of diffTargets) {
          // INSERT
          if (!diffItem.id) {
            const newProductionInfo = await db.productionInfo
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                goodId: diffItem.goodId!,
                isDisabled: diffItem.isDisabled,
                isProductionGoods: diffItem.isProductionGoods,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime()
              });
            diffItem.id = newProductionInfo.id;

            let seq = 1;
            for (const productionGoodItem of diffItem.productionGoods || []) {
              const newProductionGood = await db.goodsProductionGoods
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  productionInfoId: diffItem.id!,
                  productionInfoGoodId: diffItem.goodId,
                  seq,
                  type: productionGoodItem.type,
                  goodId: diffItem.goodId!,
                  productionGoodId: productionGoodItem.goodId!
                });
              productionGoodItem.id = newProductionGood.id;
              seq++;
            }

            seq = 1;
            for (const saleGoodItem of diffItem.saleGoods || []) {
              const newSaleGood = await db.goodsSaleGoods
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  saleInfoId: diffItem.id!,
                  saleInfoGoodId: diffItem.goodId,
                  seq,
                  goodId: diffItem.goodId!,
                  saleGoodId: saleGoodItem.goodId!
                });
              saleGoodItem.id = newSaleGood.id;
              seq++;
            }

          }
          // UPDATE
          else {
            if (await this._checkProduct(db, diffItem.goodId!)) {
              throw new Error(diffItem.goodName + " 이 현재 생산중입니다. \n생산중인 품목의 생산정보는 수정할 수 없습니다.");
            }
            await db.productionInfo
              .where(item => [
                sorm.equal(item.id, diffItem.id)
              ])
              .updateAsync(
                () => ({
                  isDisabled: diffItem.isDisabled,
                  //bothSides: diffItem.bothSides,
                  isProductionGoods: diffItem.isProductionGoods,
                  modifyAtDateTime: new DateTime(),
                  modifyByEmployeeId: this._appData.authInfo!.employeeId
                })
              );

            /*      await db.goodsProductionGoods
                    .where(item => [
                      sorm.equal(item.goodId, diffItem.goodId)
                    ]).deleteAsync();
      */
            if (diffItem.productionGoods) {
              const lastSeq = await db.goodsProductionGoods
                .orderBy(item => item.seq)
                .top(1)
                .where(item => [sorm.equal(item.goodId, diffItem.goodId)])
                .select(item => ({
                  seq: item.seq
                }))
                .singleAsync();

              for (const productionGoodItem of diffItem.productionGoods) {
                if (!productionGoodItem.id) {
                  const newProductionGood = await db.goodsProductionGoods
                    .insertAsync({
                      companyId: this._appData.authInfo!.companyId,
                      productionInfoId: diffItem.id!,
                      productionInfoGoodId: diffItem.goodId,
                      seq: lastSeq ? lastSeq.seq : 1,
                      type: productionGoodItem.type,
                      goodId: productionGoodItem.goodId!,
                      productionGoodId: productionGoodItem.goodId!
                    });
                  productionGoodItem.id = newProductionGood.id;
                }
                else {
                  await db.goodsProductionGoods
                    .where(item => [
                      sorm.equal(item.id, productionGoodItem.id)
                    ])
                    .updateAsync(
                      () => ({
                        type: productionGoodItem.type
                      })
                    );
                }
              }
            }
            if(diffItem.saleGoods){
              const lastSeq = await db.goodsSaleGoods
                .orderBy(item => item.seq)
                .top(1)
                .where(item => [sorm.equal(item.goodId, diffItem.goodId)])
                .select(item => ({
                  seq: item.seq
                }))
                .singleAsync();

              for (const saleGoodItem of diffItem.saleGoods) {
                if (!saleGoodItem.id) {
                  const newSaleGood = await db.goodsSaleGoods
                    .insertAsync({
                      companyId: this._appData.authInfo!.companyId,
                      saleInfoId: diffItem.id!,
                      saleInfoGoodId: diffItem.goodId,
                      seq: lastSeq ? lastSeq.seq : 1,
                      goodId: saleGoodItem.goodId!,
                      saleGoodId: saleGoodItem.goodId!
                    });
                  saleGoodItem.id = newSaleGood.id;
                }
              }
            }

          }
        }
      });

      this.orgItems = Object.clone(this.items);
      this._toast.success("저장되었습니다.");
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  private async _checkProduct(db: MainDbContext, goodId: number): Promise<boolean | undefined> {
    const result = await db.production
      .where(item => [
        sorm.and([
          sorm.notEqual(item.status, "생산대기"),
          sorm.notEqual(item.status, "생산완료")
        ]),
        sorm.equal(item.goodId, goodId)
      ])
      .select(item => ({
        id: item.id,
        equipmentId: item.equipmentId
      }))
      .resultAsync();

    return result ? result.length > 0 : false;
  }

  public onRemoveItemButtonClick(item: IProductionInfoVM): void {
    this.items.remove(item);

    if (this.selectedItem === item) {
      this.selectedItem = undefined;
    }
  }

  public async onAddProductionGoodButtonClick(flag: boolean): Promise<void> {

    this.selectedItem!.productionGoods = this.selectedItem!.productionGoods || [];
    this.selectedItem!.saleGoods = this.selectedItem!.saleGoods || [];

    const result = await this._modal.show(GoodsSearchModal, "품목 검색", {isMulti: true});
    if (!result) return;
    if(flag === true){
      for (const productionGoods of result || []) {
        this.selectedItem!.productionGoods!.insert(0, {
          id: undefined,
          type: "재생",
          goodId: productionGoods.id,
          //goodType: productionGoods.type,
          //goodCategory: productionGoods.category,
          goodName: productionGoods.name,
          specification: productionGoods.specification
        });
        this._cdr.markForCheck();
      }
    }else{
      for (const saleGoods of result || []) {
        this.selectedItem!.saleGoods!.insert(0, {
          id: undefined,
          goodId: saleGoods.id,
          //goodType: productionGoods.type,
          //goodCategory: productionGoods.category,
          goodName: saleGoods.name,
          specification: saleGoods.specification
        });
        this._cdr.markForCheck();
      }
    }


    this.selectedItem!.isProductionGoods = true;
  }

  public async onChangeGood(goodId: number, item: IProductionInfoVM): Promise<void> {
    if (goodId) {
      await this._orm.connectAsync(MainDbContext, async db => {
        const result = await db.goods
          .where(item1 => [
            sorm.equal(item1.id, goodId)
          ])
          .select(item1 => ({
            id: item1.id,
            type: item1.type,
            name: item1.name,
            category: item1.category,
            specification: item1.specification,
            unitPrice: item1.unitPrice,
            unitName: item1.unitName
          }))
          .singleAsync();

        if (result) {
          if (this.items.some(item1 => item !== item1 && item1.goodId === result.id)) {
            item.goodType = undefined;
            item.goodId = undefined;
            item.goodName = undefined;
            item.goodCategory = undefined;
            item.specification = undefined;
            item.unitName = undefined;
            this._toast.danger("이미 입력되어 있는 품목입니다.");
            return;
          }

          if (!!(await this._getProductionGoodInfo(result!.id!))) {
            item.goodType = undefined;
            item.goodId = undefined;
            item.goodName = undefined;
            item.goodCategory = undefined;
            item.specification = undefined;
            item.unitName = undefined;
            this._toast.danger("이미 등록되어 있는 품목입니다.");
            return;
          }

          item.goodId = result.id;
          item.goodType = result.type;
          item.goodName = result.name;
          item.goodCategory = result.category;
          item.specification = result.specification;
          item.unitName = result.unitName;
        }
      });
    }
    else {
      item.goodType = undefined;
      item.goodId = undefined;
      item.goodName = undefined;
      item.goodCategory = undefined;
      item.specification = undefined;
      item.unitName = undefined;
    }

    await this.onSelectedItemChanged(item, true);
    this._cdr.markForCheck();
  }

  public async _getProductionGoodInfo(goodId: number): Promise<Number | undefined> {
    let result: number | undefined;
    await this._orm.connectAsync(MainDbContext, async db => {
      result = await db.productionInfo
        .where(item => [sorm.equal(item.goodId, goodId)])
        .countAsync();
    });

    return result;
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

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);
        const sortQuery = "[TBL]." + this.lastFilter!.sort;


        const result = await queryable
          .orderBy(item => sorm.query(sortQuery, String))
          .include(item => item.productionGoods)
          .include(item => item.productionGoods![0].goods)
          .include(item => item.saleGoods)
          .include(item => item.saleGoods![0].goods)
          .include(item => item.goods)
          .include(item => item.equipment)
          .include(item => item.equipment![0].equipments)
          .select(item => ({
            //viewId: sorm.query("ROW_NUMBER() OVER (ORDER BY" + sortQuery + " ASC)", Number),
            id: item.id,
            goodId: item.goodId,
            goodType: item.goods!.type,
            goodName: item.goods!.name,
            goodCategory: item.goods!.category,
            specification: item.goods!.specification,
            unitName: item.goods!.unitName,
            isDisabled: item.isDisabled!,
            isProductionGoods: item.isProductionGoods,
            equipments: item.equipment && item.equipment!.map(item3 => ({
              equipmentId: item3.equipmentId,
              equipmentName: item3.equipments!.name
            })),
            productionGoods: item.productionGoods && item.productionGoods.map(item1 => ({
              id: item1.id,
              type: item1.type,
              //goodType: item1.productionGoods!.type,
              goodId: item1.productionGoodId,
              goodName: item1.goods!.name,
              specification : item1.goods!.specification
            })),
            saleGoods: item.saleGoods && item.saleGoods.map(item2 => ({
              id: item2.id,
              //goodType: item1.productionGoods!.type,
              goodId: item2.saleGoodId,
              goodName: item2.goods!.name,
              specification : item2.goods!.specification
            }))
          }))
          .resultAsync();

        this.items = result.map(item => ({
          id: item.id,
          goodId: item.goodId,
          goodType: item.goodType,
          goodName: item.goodName,
          goodCategory: item.goodCategory,
          specification: item.specification,
          unitName: item.unitName,
          isDisabled: item.isDisabled!,
          isProductionGoods: item.isProductionGoods,
          equipmentIds: item.equipments && item.equipments.map(item5 => item5.equipmentName).join(", "),
          productionGoods: item.productionGoods && item.productionGoods!.map(item1 =>({
            id: item1.id,
            type: item1.type, //재생, 판매 이녀석일듯
            //goodType: item1.goodType,
            goodId: item1.goodId,
            goodName: item1.goodName,
            specification : item1.specification
          })) || undefined,
          saleGoods: item.saleGoods && item.saleGoods!.map(item2 =>({
            id: item2.id,
            //goodType: item1.goodType,
            goodId: item2.goodId,
            goodName: item2.goodName,
            specification : item2.specification
          })) || undefined
        }));

        this.orgItems = Object.clone(this.items);

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 30);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<ProductionInfo> {
    let queryable = db.productionInfo
      .include(item => item.goods)
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    // if (this.lastFilter!.goodName) {
    //   queryable = queryable
    //     .where(item => [
    //       sorm.includes(item.goods!.name, this.lastFilter!.goodName)
    //     ]);
    // }
    if (this.lastFilter!.goodName) {
      queryable = queryable.where(item => [
        sorm.search([item.goods!.name], this.lastFilter!.goodName!.toUpperCase())
      ]);
    }

    queryable = queryable.where(item => [
      sorm.equal(item.isDisabled, this.lastFilter!.isDisabled)
    ]);
    // if (this.lastFilter!.isDisabled !== false) {
    //   queryable = queryable.where(item => [
    //     sorm.notEqual(item.isDisabled, true)
    //   ]);
    // }


    return queryable;
  }

}

interface IFilterVM {
  sort?: string;
  goodName?: string;
  isDisabled: boolean;
}

interface IProductionInfoVM {
  id: number | undefined;
  goodId: number | undefined; //이걸로 조인
  goodType: string | undefined;
  goodName: string | undefined;
  goodCategory: string | undefined;
  specification: string | undefined;
  unitName: string | undefined;
  isDisabled: boolean;
  //
  // bothSides: boolean | undefined;
  // unitId: number | undefined;
  isProductionGoods: boolean | undefined;

  productionGoods: IProductionGoodsVM[] | undefined;
  saleGoods: ISaleGoodsVM[] | undefined;
  // qualityCheckList: IQualityListVM[] | undefined;
}

export interface IProductionGoodsVM {
  id: number | undefined;
  type: "재생" | "판매";
  goodId: number | undefined;
  // goodType: string | undefined;
  // goodCategory: string | undefined;
  goodName: string | undefined;
  specification: string | undefined;

}

export interface ISaleGoodsVM {
  id: number | undefined;
  //type: "재생" | "판매";
  goodId: number | undefined;
  // goodType: string | undefined;
  // goodCategory: string | undefined;
  goodName: string | undefined;
  specification: string | undefined;

}

export interface IQualityListVM {

  chartInfo: IQualityCheckVM | undefined;
}

interface IQualityCheckVM {
}
